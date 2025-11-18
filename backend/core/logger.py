import logging
from typing import Optional

from .config import get_settings


def configure_logging(level: int | str | None = None) -> None:
    """애플리케이션 전역 로깅 설정."""
    settings = get_settings()
    resolved_level: int = _resolve_level(level, settings.debug)

    # 기존 핸들러가 있으면 제거하고 새로 설정
    root_logger = logging.getLogger()
    if root_logger.handlers:
        root_logger.handlers.clear()
    
    logging.basicConfig(
        level=resolved_level,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
        force=True,  # 기존 설정을 덮어씀
    )
    
    # uvicorn 로거도 설정
    uvicorn_logger = logging.getLogger("uvicorn")
    uvicorn_logger.setLevel(resolved_level)
    uvicorn_error_logger = logging.getLogger("uvicorn.error")
    uvicorn_error_logger.setLevel(resolved_level)
    uvicorn_access_logger = logging.getLogger("uvicorn.access")
    uvicorn_access_logger.setLevel(resolved_level)


def _resolve_level(level: int | str | None, debug: bool) -> int:
    if isinstance(level, int):
        return level
    if isinstance(level, str):
        return logging.getLevelName(level.upper())
    return logging.DEBUG if debug else logging.INFO


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """모듈별 로거 생성 헬퍼."""
    return logging.getLogger(name or "lune")


