
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


def _decode_token_with_rotation(token: str, expected_type: str | None = None) -> dict[str, Any]:
    """키 회전을 지원하는 토큰 디코드
    
    현재 키로 디코드 실패 시 이전 키로 재시도합니다.
    
    Args:
        token: JWT 토큰
        expected_type: 예상 토큰 타입 ("access" 또는 "refresh")
    
    Returns:
        디코드된 페이로드
    
    Raises:
        UnauthorizedError: 디코드 실패
    """
    settings = get_settings()
    keys_to_try = [settings.jwt_secret_key]
    
    # 이전 키가 설정되어 있으면 폴백으로 사용
    if settings.jwt_previous_key:
        keys_to_try.append(settings.jwt_previous_key)
    
    last_error = None
    for key in keys_to_try:
        try:
            payload = jwt.decode(
                token,
                key,
                algorithms=[settings.jwt_algorithm],
            )
            
            # 토큰 타입 검증
            token_type = payload.get("type")
            if expected_type and token_type != expected_type:
                if expected_type == "access" and token_type == "refresh":
                    raise UnauthorizedError("리프레시 토큰은 인증에 사용할 수 없습니다.")
                elif expected_type == "refresh" and token_type != "refresh":
                    raise UnauthorizedError("유효하지 않은 리프레시 토큰입니다.")
            
            return payload
            
        except JWTError as e:
            last_error = e
            continue
    
    # 모든 키로 실패
    error_msg = "유효하지 않은 토큰입니다." if expected_type != "refresh" else "유효하지 않은 리프레시 토큰입니다."
    raise UnauthorizedError(error_msg) from last_error


def decode_access_token(token: str) -> dict[str, Any]:
    """액세스 토큰 디코드 및 검증 (키 회전 지원)"""
    return _decode_token_with_rotation(token, expected_type="access")


def decode_refresh_token(token: str) -> dict[str, Any]:
    """리프레시 토큰 디코드 및 검증 (키 회전 지원)"""
    return _decode_token_with_rotation(token, expected_type="refresh")


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



