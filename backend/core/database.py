from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from .config import get_settings
from .logger import get_logger

logger = get_logger(__name__)

settings = get_settings()

# 데이터베이스 URL 로깅 (보안을 위해 비밀번호는 마스킹)
try:
    from urllib.parse import urlparse, quote
    parsed = urlparse(settings.database_url)
    # 호스트명과 포트 로깅
    hostname = parsed.hostname or "unknown"
    port = parsed.port or (5432 if "pooler" not in hostname else 6543)
    logger.info(f"데이터베이스 연결 시도: {parsed.scheme}://{parsed.username}:***@{hostname}:{port}{parsed.path}")
    
    # IPv4 호환성 경고
    if hostname and "pooler.supabase.com" not in hostname and port == 5432:
        logger.warning("⚠️  Direct connection (포트 5432) 사용 중 - IPv4 호환성 문제가 있을 수 있습니다!")
        logger.warning("⚠️  Session Pooler (포트 6543) 사용을 권장합니다: aws-0-[지역].pooler.supabase.com")
    elif "pooler.supabase.com" in hostname:
        logger.info("✅ Session Pooler 사용 중 (IPv4 호환)")
except Exception as e:
    # URL 파싱 실패해도 연결은 시도
    logger.warning(f"데이터베이스 URL 파싱 경고: {e}")
    logger.info("데이터베이스 연결 시도 중...")

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    class_=Session,
)


def get_db() -> Generator[Session, None, None]:
    """요청 단위 데이터베이스 세션 의존성."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


