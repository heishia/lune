from typing import Generator
from contextlib import contextmanager

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


@contextmanager
def transaction(db: Session):
    """트랜잭션 컨텍스트 매니저
    
    사용 예:
        with transaction(db):
            db.add(order)
            db.add(order_item)
            # 성공 시 자동 커밋, 실패 시 자동 롤백
    
    참고:
        FastAPI의 기본 세션 관리가 있으므로,
        여러 작업을 원자적으로 처리해야 할 때만 사용
    """
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Transaction failed: {e}")
        raise


@contextmanager
def atomic_transaction():
    """독립적인 트랜잭션 컨텍스트
    
    사용 예:
        with atomic_transaction() as db:
            service.create_order(db, ...)
            # 성공 시 자동 커밋, 실패 시 자동 롤백
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Atomic transaction failed: {e}")
        raise
    finally:
        db.close()


