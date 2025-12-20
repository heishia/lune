
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from .config import get_settings
from .exceptions import UnauthorizedError

# passlib의 bcrypt 사용
pwd_context = CryptContext(
    schemes=["bcrypt"],
    bcrypt__ident="2b",
    deprecated="auto"
)
security_scheme = HTTPBearer(auto_error=True)
# 리프레시 토큰용 (자동 에러 없이)
security_scheme_optional = HTTPBearer(auto_error=False)


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str,
    expires_minutes: Optional[int] = None,
    extra_claims: Optional[dict[str, Any]] = None,
) -> str:
    """액세스 토큰 생성 (기본 30분 만료)"""
    settings = get_settings()
    expire_delta = expires_minutes or settings.access_token_expire_minutes
    now = datetime.now(timezone.utc)
    to_encode: dict[str, Any] = {
        "sub": subject,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expire_delta)).timestamp()),
    }
    if extra_claims:
        to_encode.update(extra_claims)

    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return encoded_jwt


def create_refresh_token(
    subject: str,
    expires_days: Optional[int] = None,
) -> str:
    """리프레시 토큰 생성 (기본 7일 만료)"""
    settings = get_settings()
    expire_delta = expires_days or settings.refresh_token_expire_days
    now = datetime.now(timezone.utc)
    to_encode: dict[str, Any] = {
        "sub": subject,
        "type": "refresh",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=expire_delta)).timestamp()),
    }

    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any]:
    """액세스 토큰 디코드 및 검증"""
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        # 토큰 타입 검증 (리프레시 토큰은 사용 불가)
        if payload.get("type") == "refresh":
            raise UnauthorizedError("리프레시 토큰은 인증에 사용할 수 없습니다.")
    except JWTError as exc:
        raise UnauthorizedError("유효하지 않은 토큰입니다.") from exc

    return payload


def decode_refresh_token(token: str) -> dict[str, Any]:
    """리프레시 토큰 디코드 및 검증"""
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        # 토큰 타입 검증 (액세스 토큰은 사용 불가)
        if payload.get("type") != "refresh":
            raise UnauthorizedError("유효하지 않은 리프레시 토큰입니다.")
    except JWTError as exc:
        raise UnauthorizedError("유효하지 않은 리프레시 토큰입니다.") from exc

    return payload


def get_current_user_payload(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> dict[str, Any]:
    token = credentials.credentials
    return decode_access_token(token)


def get_current_user_id(payload: dict[str, Any] = Depends(get_current_user_payload)) -> str:
    subject = payload.get("sub")
    if not subject:
        raise UnauthorizedError("토큰에 사용자 정보가 없습니다.")
    return str(subject)


def get_admin_user_id(payload: dict[str, Any] = Depends(get_current_user_payload)) -> str:
    """관리자 권한이 있는 사용자인지 확인"""
    subject = payload.get("sub")
    if not subject:
        raise UnauthorizedError("토큰에 사용자 정보가 없습니다.")
    
    is_admin = payload.get("is_admin", False)
    if not is_admin:
        raise UnauthorizedError("관리자 권한이 필요합니다.")
    
    return str(subject)



