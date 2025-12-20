"""애플리케이션 설정 모듈

환경별로 다른 설정을 적용할 수 있도록 계층화된 설정 클래스를 제공합니다.
"""
import os
from functools import lru_cache
from typing import Literal, List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class BaseAppSettings(BaseSettings):
    """기본 설정 클래스 - 모든 환경에서 공통으로 사용되는 설정"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # 환경 식별
    env: Literal["local", "dev", "prod"] = Field("local", description="실행 환경")
    app_name: str = Field("LUNE API", description="애플리케이션 이름")
    app_version: str = Field("0.1.0", description="애플리케이션 버전")
    debug: bool = Field(False, description="디버그 모드 여부")

    # 데이터베이스
    database_url: str = Field(..., description="PostgreSQL 접속 URL (Supabase)")

    # Supabase
    supabase_url: str = Field("", description="Supabase 프로젝트 URL")
    supabase_service_key: str = Field("", description="Supabase Service Role Key")

    # JWT
    jwt_secret_key: str = Field(..., validation_alias="JWT_SECRET", description="JWT 서명용 시크릿 키")
    jwt_previous_key: str = Field("", description="JWT 이전 키 (키 회전용)")
    jwt_algorithm: str = Field("HS256", description="JWT 서명 알고리즘")
    access_token_expire_minutes: int = Field(30, description="엑세스 토큰 만료 시간(분)")
    refresh_token_expire_days: int = Field(7, description="리프레시 토큰 만료 시간(일)")

    # 카카오
    kakao_rest_api_key: str = Field("", description="카카오톡 REST API 키")
    kakao_client_secret: str = Field("", description="카카오톡 Client Secret")
    kakao_redirect_uri: str = Field("", description="카카오톡 OAuth 리다이렉트 URI")

    # 관리자
    admin_email: str = Field("admin", description="관리자 이메일")
    admin_password_hash: str = Field("", description="관리자 비밀번호 해시 (bcrypt)")

    # Redis
    redis_url: str = Field("redis://localhost:6379", description="Redis 접속 URL")

    # Celery
    celery_broker_url: str = Field("", description="Celery 브로커 URL")
    celery_result_backend: str = Field("", description="Celery 결과 백엔드 URL")

    # Sentry
    sentry_dsn: str = Field("", description="Sentry DSN")

    @property
    def effective_celery_broker(self) -> str:
        """Celery 브로커 URL 반환"""
        return self.celery_broker_url or self.redis_url

    @property
    def effective_celery_backend(self) -> str:
        """Celery 결과 백엔드 URL 반환"""
        return self.celery_result_backend or self.redis_url

    @property
    def is_production(self) -> bool:
        """프로덕션 환경 여부"""
        return self.env == "prod"

    @property
    def is_development(self) -> bool:
        """개발 환경 여부"""
        return self.env in ("local", "dev")


class LocalSettings(BaseAppSettings):
    """로컬 개발 환경 설정"""

    env: Literal["local", "dev", "prod"] = "local"
    debug: bool = True

    # 로컬에서는 더 긴 토큰 만료 시간
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    # 로컬 Redis (없어도 동작)
    redis_url: str = Field("redis://localhost:6379", description="Redis 접속 URL")


class DevSettings(BaseAppSettings):
    """개발 서버 환경 설정"""

    env: Literal["local", "dev", "prod"] = "dev"
    debug: bool = True

    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14


class ProdSettings(BaseAppSettings):
    """프로덕션 환경 설정"""

    env: Literal["local", "dev", "prod"] = "prod"
    debug: bool = False

    # 프로덕션에서는 더 짧은 토큰 만료 시간
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7


# 환경별 설정 클래스 매핑
_settings_map = {
    "local": LocalSettings,
    "dev": DevSettings,
    "prod": ProdSettings,
}


@lru_cache()
def get_settings() -> BaseAppSettings:
    """현재 환경에 맞는 설정 싱글톤 반환
    
    ENV 환경변수에 따라 적절한 설정 클래스를 선택합니다.
    """
    env = os.getenv("ENV", "local")
    settings_class = _settings_map.get(env, LocalSettings)
    return settings_class()


# 하위 호환성을 위한 타입 별칭
Settings = BaseAppSettings
