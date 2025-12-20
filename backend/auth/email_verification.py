"""이메일 인증 시스템

회원가입 시 이메일 인증을 처리하는 모듈입니다.
SMTP 설정이 없으면 이메일 인증을 건너뜁니다.
"""
from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4
import secrets
import hashlib

from sqlalchemy.orm import Session

from backend.core import models
from backend.core.config import get_settings
from backend.core.exceptions import BadRequestError, NotFoundError
from backend.core.logger import get_logger

logger = get_logger(__name__)

# 인증 토큰 유효 시간 (24시간)
VERIFICATION_TOKEN_EXPIRE_HOURS = 24


def generate_verification_token() -> str:
    """안전한 인증 토큰 생성"""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """토큰 해시 (데이터베이스 저장용)"""
    return hashlib.sha256(token.encode()).hexdigest()


def create_email_verification(
    db: Session,
    user_id: str,
    email: str,
) -> tuple[str, datetime]:
    """이메일 인증 토큰 생성
    
    Returns:
        (token, expires_at): 원본 토큰과 만료 시간
    """
    token = generate_verification_token()
    token_hash = hash_token(token)
    expires_at = datetime.utcnow() + timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS)
    
    # 기존 인증 레코드가 있으면 삭제
    db.query(models.EmailVerification).filter(
        models.EmailVerification.user_id == user_id
    ).delete()
    
    # 새 인증 레코드 생성
    verification = models.EmailVerification(
        id=str(uuid4()),
        user_id=user_id,
        email=email,
        token_hash=token_hash,
        expires_at=expires_at,
        created_at=datetime.utcnow(),
    )
    db.add(verification)
    db.commit()
    
    return token, expires_at


def verify_email_token(db: Session, token: str) -> models.User:
    """이메일 인증 토큰 검증 및 사용자 활성화
    
    Returns:
        인증된 사용자
    """
    token_hash = hash_token(token)
    
    # 토큰으로 인증 레코드 조회
    verification = db.query(models.EmailVerification).filter(
        models.EmailVerification.token_hash == token_hash
    ).first()
    
    if not verification:
        raise NotFoundError("유효하지 않은 인증 링크입니다.")
    
    # 만료 확인
    if verification.expires_at < datetime.utcnow():
        # 만료된 토큰 삭제
        db.delete(verification)
        db.commit()
        raise BadRequestError("인증 링크가 만료되었습니다. 새로운 인증 이메일을 요청해주세요.")
    
    # 사용자 조회 및 이메일 인증 상태 업데이트
    user = db.query(models.User).filter(
        models.User.id == verification.user_id
    ).first()
    
    if not user:
        raise NotFoundError("사용자를 찾을 수 없습니다.")
    
    # 이메일 인증 완료
    user.is_email_verified = True
    user.updated_at = datetime.utcnow()
    
    # 인증 레코드 삭제
    db.delete(verification)
    db.commit()
    db.refresh(user)
    
    logger.info(f"Email verified for user: {user.email}")
    return user


async def send_verification_email(
    email: str,
    verification_token: str,
    base_url: str = "",
) -> bool:
    """인증 이메일 발송
    
    참고: SMTP 설정이 없으면 로그만 출력하고 True 반환
    
    Args:
        email: 수신자 이메일
        verification_token: 인증 토큰
        base_url: 프론트엔드 URL (인증 링크 생성용)
        
    Returns:
        발송 성공 여부
    """
    settings = get_settings()
    
    # 인증 링크 생성
    verify_url = f"{base_url}/verify-email?token={verification_token}"
    
    # SMTP 설정 확인 (추후 추가 필요)
    # 현재는 로그만 출력
    logger.info(f"Email verification requested for: {email}")
    logger.info(f"Verification URL: {verify_url}")
    
    # TODO: 실제 이메일 발송 로직 구현
    # SMTP 설정이 없으면 로그만 출력
    # 개발 환경에서는 콘솔에 인증 링크 출력
    if settings.env in ("local", "dev"):
        logger.info("=" * 50)
        logger.info("EMAIL VERIFICATION (Development Mode)")
        logger.info(f"To: {email}")
        logger.info(f"Verify URL: {verify_url}")
        logger.info("=" * 50)
        return True
    
    # TODO: 프로덕션에서는 실제 이메일 서비스 사용
    # - SMTP (smtplib)
    # - SendGrid, Mailgun 등 외부 서비스
    # - AWS SES
    
    return True


def resend_verification_email(db: Session, user_id: str) -> tuple[str, datetime]:
    """인증 이메일 재발송
    
    Returns:
        (token, expires_at): 새 토큰과 만료 시간
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise NotFoundError("사용자를 찾을 수 없습니다.")
    
    if user.is_email_verified:
        raise BadRequestError("이미 이메일이 인증되었습니다.")
    
    return create_email_verification(db, user_id, user.email)

