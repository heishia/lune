from typing import Optional

from sqlalchemy.orm import Session

from backend.core import models
from backend.core.config import get_settings
from backend.core.exceptions import ConflictError, NotFoundError, UnauthorizedError
from backend.core.security import create_access_token, hash_password, verify_password
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
    try:
        settings = get_settings()
        
        # 디버깅: 설정된 관리자 정보 확인
        logger.info(f"Admin check - Settings admin_email: {settings.admin_email}")
        logger.info(f"Admin check - Input email: {email}")
        logger.info(f"Admin check - Email match: {email == settings.admin_email}")
        logger.info(f"Admin check - Password match: {password == settings.admin_password}")
        
        # 관리자 계정 체크
        if settings.admin_email and settings.admin_password:
            if email == settings.admin_email and password == settings.admin_password:
                logger.info("Admin credentials matched! Creating/fetching admin user...")
                # 관리자 계정이 DB에 있는지 확인
                admin_user = get_user_by_email(db, email=settings.admin_email)
                if not admin_user:
                    # 관리자 계정이 없으면 생성
                    logger.info("Admin user not found in DB, creating new admin user...")
                    from uuid import uuid4
                    from datetime import datetime
                    admin_user = models.User(
                        id=str(uuid4()),
                        email=settings.admin_email,
                        name="관리자",
                        password_hash=hash_password(settings.admin_password),
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
                    logger.info("Admin user created successfully!")
                else:
                    logger.info("Admin user found in DB!")
                    # 기존 관리자 계정의 is_admin이 false인 경우 업데이트
                    if not admin_user.is_admin:
                        from datetime import datetime
                        admin_user.is_admin = True
                        admin_user.updated_at = datetime.utcnow()
                        db.commit()
                        db.refresh(admin_user)
                        logger.info("Admin user is_admin field updated to True!")
                return admin_user
    except Exception as e:
        # 설정 로드 실패 시 일반 사용자 로그인으로 진행
        logger.error(f"Admin auth error: {e}")
    
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
        extra_claims={
            "email": user.email,
            "name": user.name,
            "is_admin": getattr(user, 'is_admin', False),
        },
    )


def get_user_by_id(db: Session, user_id: str) -> models.User:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise NotFoundError("사용자를 찾을 수 없습니다.")
    return user


