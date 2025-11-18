import logging
from typing import Optional

from .config import get_settings


def configure_logging(level: int | str | None = None) -> None:
    """애플리케이션 전역 로깅 설정."""
    settings = get_settings()
    resolved_level: int = _resolve_level(level, settings.debug)

    logging.basicConfig(
        level=resolved_level,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    )


def _resolve_level(level: int | str | None, debug: bool) -> int:
    if isinstance(level, int):
        return level
    if isinstance(level, str):
        return logging.getLevelName(level.upper())
    return logging.DEBUG if debug else logging.INFO


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """모듈별 로거 생성 헬퍼."""
    return logging.getLogger(name or "lune")


