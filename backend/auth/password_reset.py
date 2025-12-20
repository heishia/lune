"""비밀번호 재설정 시스템

비밀번호 분실 시 재설정 이메일을 발송하고 처리하는 모듈입니다.
"""
from datetime import datetime, timedelta
from uuid import uuid4
import secrets
import hashlib

from sqlalchemy.orm import Session

from backend.core import models
from backend.core.config import get_settings
from backend.core.exceptions import BadRequestError, NotFoundError
from backend.core.security import hash_password
from backend.core.logger import get_logger

logger = get_logger(__name__)

# 재설정 토큰 유효 시간 (1시간)
RESET_TOKEN_EXPIRE_HOURS = 1


def generate_reset_token() -> str:
    """안전한 재설정 토큰 생성"""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """토큰 해시 (데이터베이스 저장용)"""
    return hashlib.sha256(token.encode()).hexdigest()


def create_password_reset(
    db: Session,
    email: str,
) -> tuple[str, datetime]:
    """비밀번호 재설정 토큰 생성
    
    Returns:
        (token, expires_at): 원본 토큰과 만료 시간
    """
    # 사용자 확인
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        # 보안상 사용자가 없어도 같은 메시지 반환
        logger.info(f"Password reset requested for non-existent email: {email}")
        raise NotFoundError("해당 이메일로 등록된 계정을 찾을 수 없습니다.")
    
    if not user.is_active:
        raise BadRequestError("비활성화된 계정입니다. 고객센터에 문의해주세요.")
    
    token = generate_reset_token()
    token_hash = hash_token(token)
    expires_at = datetime.utcnow() + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)
    
    # 기존 재설정 레코드가 있으면 삭제
    db.query(models.PasswordReset).filter(
        models.PasswordReset.user_id == user.id
    ).delete()
    
    # 새 재설정 레코드 생성
    reset = models.PasswordReset(
        id=str(uuid4()),
        user_id=user.id,
        email=email,
        token_hash=token_hash,
        expires_at=expires_at,
        created_at=datetime.utcnow(),
    )
    db.add(reset)
    db.commit()
    
    return token, expires_at


def verify_reset_token(db: Session, token: str) -> models.User:
    """재설정 토큰 검증
    
    Returns:
        토큰에 해당하는 사용자 (비밀번호 변경 전)
    """
    token_hash = hash_token(token)
    
    # 토큰으로 재설정 레코드 조회
    reset = db.query(models.PasswordReset).filter(
        models.PasswordReset.token_hash == token_hash
    ).first()
    
    if not reset:
        raise NotFoundError("유효하지 않은 재설정 링크입니다.")
    
    # 만료 확인
    if reset.expires_at < datetime.utcnow():
        db.delete(reset)
        db.commit()
        raise BadRequestError("재설정 링크가 만료되었습니다. 새로운 재설정 이메일을 요청해주세요.")
    
    # 사용자 조회
    user = db.query(models.User).filter(
        models.User.id == reset.user_id
    ).first()
    
    if not user:
        raise NotFoundError("사용자를 찾을 수 없습니다.")
    
    return user


def reset_password(db: Session, token: str, new_password: str) -> models.User:
    """토큰으로 비밀번호 재설정
    
    Returns:
        비밀번호가 변경된 사용자
    """
    token_hash = hash_token(token)
    
    # 토큰으로 재설정 레코드 조회
    reset = db.query(models.PasswordReset).filter(
        models.PasswordReset.token_hash == token_hash
    ).first()
    
    if not reset:
        raise NotFoundError("유효하지 않은 재설정 링크입니다.")
    
    # 만료 확인
    if reset.expires_at < datetime.utcnow():
        db.delete(reset)
        db.commit()
        raise BadRequestError("재설정 링크가 만료되었습니다. 새로운 재설정 이메일을 요청해주세요.")
    
    # 사용자 조회 및 비밀번호 변경
    user = db.query(models.User).filter(
        models.User.id == reset.user_id
    ).first()
    
    if not user:
        raise NotFoundError("사용자를 찾을 수 없습니다.")
    
    # 비밀번호 변경
    user.password_hash = hash_password(new_password)
    user.updated_at = datetime.utcnow()
    
    # 재설정 레코드 삭제
    db.delete(reset)
    db.commit()
    db.refresh(user)
    
    logger.info(f"Password reset completed for user: {user.email}")
    return user


async def send_password_reset_email(
    email: str,
    reset_token: str,
    base_url: str = "",
) -> bool:
    """비밀번호 재설정 이메일 발송
    
    Args:
        email: 수신자 이메일
        reset_token: 재설정 토큰
        base_url: 프론트엔드 URL
        
    Returns:
        발송 성공 여부
    """
    settings = get_settings()
    
    # 재설정 링크 생성
    reset_url = f"{base_url}/reset-password?token={reset_token}"
    
    logger.info(f"Password reset requested for: {email}")
    logger.info(f"Reset URL: {reset_url}")
    
    # 개발 환경에서는 콘솔에 링크 출력
    if settings.env in ("local", "dev"):
        logger.info("=" * 50)
        logger.info("PASSWORD RESET (Development Mode)")
        logger.info(f"To: {email}")
        logger.info(f"Reset URL: {reset_url}")
        logger.info("=" * 50)
        return True
    
    # TODO: 프로덕션에서는 실제 이메일 서비스 사용
    
    return True

