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
settings = get_settings()
security_scheme = HTTPBearer(auto_error=True)


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str,
    expires_minutes: Optional[int] = None,
    extra_claims: Optional[dict[str, Any]] = None,
) -> str:
    expire_delta = expires_minutes or settings.access_token_expire_minutes
    now = datetime.now(timezone.utc)
    to_encode: dict[str, Any] = {
        "sub": subject,
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


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as exc:
        raise UnauthorizedError("유효하지 않은 토큰입니다.") from exc

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



