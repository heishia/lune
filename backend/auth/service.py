from typing import Optional

from sqlalchemy.orm import Session

from backend.core import models
from backend.core.config import get_settings
from backend.core.exceptions import ConflictError, NotFoundError, UnauthorizedError
from backend.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from backend.core.logger import get_logger

logger = get_logger(__name__)


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(
    db: Session,
    email: str,
    password: str,
    name: str,
    phone: str,
    marketing_agreed: bool,
) -> models.User:
    existing = get_user_by_email(db, email=email)
    if existing:
        raise ConflictError("이미 존재하는 이메일입니다.")

    from uuid import uuid4
    from datetime import datetime
    
    user = models.User(
        id=str(uuid4()),
        email=email,
        name=name,
        password_hash=hash_password(password),
        phone=phone,
        marketing_agreed=marketing_agreed,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> models.User:
    """사용자 인증 (관리자 계정 및 일반 사용자 모두 지원)"""
    settings = get_settings()
    
    # 관리자 계정 체크 (해시 비교 사용)
    if settings.admin_email and settings.admin_password_hash:
        if email == settings.admin_email and verify_password(password, settings.admin_password_hash):
            # 관리자 계정이 DB에 있는지 확인
            admin_user = get_user_by_email(db, email=settings.admin_email)
            if not admin_user:
                # 관리자 계정이 없으면 생성
                from uuid import uuid4
                from datetime import datetime
                admin_user = models.User(
                    id=str(uuid4()),
                    email=settings.admin_email,
                    name="관리자",
                    password_hash=settings.admin_password_hash,
                    phone="000-0000-0000",
                    marketing_agreed=False,
                    is_active=True,
                    is_admin=True,
                    points=0,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                db.add(admin_user)
                db.commit()
                db.refresh(admin_user)
            else:
                # 기존 관리자 계정의 is_admin이 false인 경우 업데이트
                if not admin_user.is_admin:
                    from datetime import datetime
                    admin_user.is_admin = True
                    admin_user.updated_at = datetime.utcnow()
                    db.commit()
                    db.refresh(admin_user)
            return admin_user
    
    # 일반 사용자 로그인
    user = get_user_by_email(db, email=email)
    if not user:
        raise UnauthorizedError("이메일 또는 비밀번호가 올바르지 않습니다.")

    if not verify_password(password, user.password_hash):
        raise UnauthorizedError("이메일 또는 비밀번호가 올바르지 않습니다.")

    if not user.is_active:
        raise UnauthorizedError("비활성화된 계정입니다.")

    return user


def create_user_token(user: models.User) -> str:
    """액세스 토큰 생성 (하위 호환성 유지)"""
    return create_access_token(
        subject=str(user.id),
        extra_claims={
            "email": user.email,
            "name": user.name,
            "is_admin": getattr(user, 'is_admin', False),
        },
    )


def create_user_tokens(user: models.User) -> tuple[str, str]:
    """액세스 토큰과 리프레시 토큰 쌍 생성"""
    access_token = create_access_token(
        subject=str(user.id),
        extra_claims={
            "email": user.email,
            "name": user.name,
            "is_admin": getattr(user, 'is_admin', False),
        },
    )
    refresh_token = create_refresh_token(subject=str(user.id))
    return access_token, refresh_token


def refresh_access_token(db: Session, refresh_token: str) -> tuple[str, str]:
    """리프레시 토큰으로 새 토큰 쌍 발급"""
    payload = decode_refresh_token(refresh_token)
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("유효하지 않은 리프레시 토큰입니다.")
    
    user = get_user_by_id(db, user_id)
    if not user.is_active:
        raise UnauthorizedError("비활성화된 계정입니다.")
    
    return create_user_tokens(user)


def get_user_by_id(db: Session, user_id: str) -> models.User:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise NotFoundError("사용자를 찾을 수 없습니다.")
    return user

