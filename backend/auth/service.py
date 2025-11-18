from typing import Optional

from sqlalchemy.orm import Session

from backend.core import models
from backend.core.config import get_settings
from backend.core.exceptions import ConflictError, NotFoundError, UnauthorizedError
from backend.core.security import create_access_token, hash_password, verify_password


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

    user = models.User(
        email=email,
        name=name,
        password_hash=hash_password(password),
        phone=phone,
        marketing_agreed=marketing_agreed,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> models.User:
    settings = get_settings()
    
    # 관리자 계정 체크
    if email == settings.admin_email and password == settings.admin_password:
        # 관리자용 가상 사용자 객체 반환 (실제 DB에 저장되지 않음)
        # 또는 관리자 전용 토큰 생성
        from uuid import uuid4
        admin_user = models.User(
            id=str(uuid4()),
            email=settings.admin_email,
            name="관리자",
            password_hash="",  # 관리자는 비밀번호 해시 불필요
            phone="000-0000-0000",
            marketing_agreed=False,
            is_active=True,
        )
        return admin_user
    
    user = get_user_by_email(db, email=email)
    if not user:
        raise UnauthorizedError("이메일 또는 비밀번호가 올바르지 않습니다.")

    if not verify_password(password, user.password_hash):
        raise UnauthorizedError("이메일 또는 비밀번호가 올바르지 않습니다.")

    if not user.is_active:
        raise UnauthorizedError("비활성화된 계정입니다.")

    return user


def create_user_token(user: models.User) -> str:
    return create_access_token(
        subject=str(user.id),
        extra_claims={"email": user.email, "name": user.name},
    )


def get_user_by_id(db: Session, user_id: str) -> models.User:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise NotFoundError("사용자를 찾을 수 없습니다.")
    return user


