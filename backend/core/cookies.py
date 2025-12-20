"""쿠키 관리 유틸리티

httpOnly 쿠키를 통한 안전한 토큰 관리를 제공합니다.
"""
from typing import Optional

from fastapi import Response, Request

from .config import get_settings

settings = get_settings()

# 쿠키 이름
ACCESS_TOKEN_COOKIE = "lune_access_token"
REFRESH_TOKEN_COOKIE = "lune_refresh_token"


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
) -> None:
    """인증 토큰을 httpOnly 쿠키로 설정
    
    Args:
        response: FastAPI Response 객체
        access_token: 액세스 토큰
        refresh_token: 리프레시 토큰
    """
    # 액세스 토큰 쿠키 (짧은 만료)
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=access_token,
        httponly=True,
        secure=settings.is_production,  # HTTPS에서만 (프로덕션)
        samesite="lax",
        max_age=settings.access_token_expire_minutes * 60,
        path="/",
    )
    
    # 리프레시 토큰 쿠키 (긴 만료)
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE,
        value=refresh_token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path="/auth",  # /auth 경로에서만 접근
    )


def clear_auth_cookies(response: Response) -> None:
    """인증 쿠키 삭제 (로그아웃)"""
    response.delete_cookie(
        key=ACCESS_TOKEN_COOKIE,
        path="/",
    )
    response.delete_cookie(
        key=REFRESH_TOKEN_COOKIE,
        path="/auth",
    )


def get_access_token_from_cookie(request: Request) -> Optional[str]:
    """쿠키에서 액세스 토큰 추출"""
    return request.cookies.get(ACCESS_TOKEN_COOKIE)


def get_refresh_token_from_cookie(request: Request) -> Optional[str]:
    """쿠키에서 리프레시 토큰 추출"""
    return request.cookies.get(REFRESH_TOKEN_COOKIE)

