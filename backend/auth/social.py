"""소셜 로그인 서비스

Google, Naver 소셜 로그인을 지원합니다.
"""
from typing import Optional
from datetime import datetime
from uuid import uuid4

import httpx

from backend.core.config import get_settings
from backend.core.logger import get_logger
from backend.core.exceptions import UnauthorizedError, BadRequestError

logger = get_logger(__name__)
settings = get_settings()


class SocialLoginProvider:
    """소셜 로그인 제공자 기본 클래스"""
    
    name: str = "base"
    
    async def get_user_info(self, access_token: str) -> dict:
        """액세스 토큰으로 사용자 정보 조회"""
        raise NotImplementedError


class GoogleProvider(SocialLoginProvider):
    """Google 소셜 로그인"""
    
    name = "google"
    
    def __init__(self):
        self.client_id = getattr(settings, 'google_client_id', '')
        self.client_secret = getattr(settings, 'google_client_secret', '')
        self.redirect_uri = getattr(settings, 'google_redirect_uri', '')
    
    def get_authorize_url(self, state: str = "") -> str:
        """Google OAuth 인증 URL 생성"""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": "email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"https://accounts.google.com/o/oauth2/v2/auth?{query}"
    
    async def get_tokens(self, code: str) -> dict:
        """인가 코드로 토큰 교환"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": self.redirect_uri,
                },
            )
            
            if response.status_code != 200:
                logger.error("Google token error: %s", response.text)
                raise UnauthorizedError("Google 인증에 실패했습니다.")
            
            return response.json()
    
    async def get_user_info(self, access_token: str) -> dict:
        """액세스 토큰으로 사용자 정보 조회"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            
            if response.status_code != 200:
                logger.error("Google user info error: %s", response.text)
                raise UnauthorizedError("Google 사용자 정보 조회에 실패했습니다.")
            
            data = response.json()
            
            return {
                "provider": self.name,
                "provider_id": data.get("id"),
                "email": data.get("email"),
                "name": data.get("name"),
                "picture": data.get("picture"),
            }


class NaverProvider(SocialLoginProvider):
    """Naver 소셜 로그인"""
    
    name = "naver"
    
    def __init__(self):
        self.client_id = getattr(settings, 'naver_client_id', '')
        self.client_secret = getattr(settings, 'naver_client_secret', '')
        self.redirect_uri = getattr(settings, 'naver_redirect_uri', '')
    
    def get_authorize_url(self, state: str = "") -> str:
        """Naver OAuth 인증 URL 생성"""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "state": state,
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"https://nid.naver.com/oauth2.0/authorize?{query}"
    
    async def get_tokens(self, code: str, state: str = "") -> dict:
        """인가 코드로 토큰 교환"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://nid.naver.com/oauth2.0/token",
                params={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "state": state,
                    "grant_type": "authorization_code",
                },
            )
            
            if response.status_code != 200:
                logger.error("Naver token error: %s", response.text)
                raise UnauthorizedError("Naver 인증에 실패했습니다.")
            
            return response.json()
    
    async def get_user_info(self, access_token: str) -> dict:
        """액세스 토큰으로 사용자 정보 조회"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://openapi.naver.com/v1/nid/me",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            
            if response.status_code != 200:
                logger.error("Naver user info error: %s", response.text)
                raise UnauthorizedError("Naver 사용자 정보 조회에 실패했습니다.")
            
            data = response.json()
            profile = data.get("response", {})
            
            return {
                "provider": self.name,
                "provider_id": profile.get("id"),
                "email": profile.get("email"),
                "name": profile.get("name") or profile.get("nickname"),
                "picture": profile.get("profile_image"),
            }


# 제공자 인스턴스
google_provider = GoogleProvider()
naver_provider = NaverProvider()


def get_provider(name: str) -> SocialLoginProvider:
    """제공자 이름으로 인스턴스 반환"""
    providers = {
        "google": google_provider,
        "naver": naver_provider,
    }
    
    provider = providers.get(name)
    if not provider:
        raise BadRequestError(f"지원하지 않는 소셜 로그인: {name}")
    
    return provider

