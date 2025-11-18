from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """애플리케이션 전역 설정을 관리하는 클래스.

    환경 변수와 .env 파일을 통해 값을 로드한다.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    env: Literal["local", "dev", "prod"] = Field("local", description="실행 환경")
    app_name: str = Field("LUNE API", description="애플리케이션 이름")
    app_version: str = Field("0.1.0", description="애플리케이션 버전")
    debug: bool = Field(False, description="디버그 모드 여부")

    database_url: str = Field(..., description="PostgreSQL 접속 URL (Supabase)")

    jwt_secret_key: str = Field(..., validation_alias="JWT_SECRET", description="JWT 서명용 시크릿 키")
    jwt_algorithm: str = Field("HS256", description="JWT 서명 알고리즘")
    access_token_expire_minutes: int = Field(
        60 * 24 * 7,
        description="엑세스 토큰 만료 시간(분 단위, 기본 7일)",
    )


@lru_cache()
def get_settings() -> Settings:
    """전역에서 재사용할 수 있는 Settings 싱글톤."""
    return Settings()


