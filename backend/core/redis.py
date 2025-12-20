"""Redis 연결 및 캐싱 유틸리티

Redis 클라이언트 설정과 캐싱 데코레이터를 제공합니다.
"""
import json
from functools import wraps
from typing import Any, Callable, Optional

import redis
from redis.exceptions import ConnectionError, TimeoutError

from .config import get_settings
from .logger import get_logger

logger = get_logger(__name__)

# Redis 클라이언트 (지연 초기화)
_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> redis.Redis:
    """Redis 클라이언트 싱글톤 반환"""
    global _redis_client
    if _redis_client is None:
        settings = get_settings()
        try:
            _redis_client = redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5,
                retry_on_timeout=True,
            )
            # 연결 테스트
            _redis_client.ping()
            logger.info("Redis 연결 성공: %s", settings.redis_url.split("@")[-1] if "@" in settings.redis_url else "localhost")
        except (ConnectionError, TimeoutError) as e:
            logger.warning("Redis 연결 실패, 캐싱 비활성화: %s", str(e))
            _redis_client = None
            raise
    return _redis_client


def is_redis_available() -> bool:
    """Redis 연결 가능 여부 확인"""
    try:
        client = get_redis_client()
        return client is not None and client.ping()
    except Exception:
        return False


def cache(
    ttl: int = 300,
    prefix: str = "",
    key_builder: Optional[Callable[..., str]] = None,
):
    """Redis 캐싱 데코레이터
    
    Args:
        ttl: 캐시 만료 시간 (초 단위, 기본 5분)
        prefix: 캐시 키 prefix
        key_builder: 커스텀 키 생성 함수
    
    Example:
        @cache(ttl=300, prefix="products")
        def get_products(category: str):
            return db.query(Product).filter(...)
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Redis 연결 실패 시 원본 함수 실행
            try:
                client = get_redis_client()
            except Exception:
                return func(*args, **kwargs)
            
            # 캐시 키 생성
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                # 기본 키: prefix:func_name:args_hash
                args_str = str(args) + str(sorted(kwargs.items()))
                cache_key = f"{prefix}:{func.__name__}:{hash(args_str)}"
            
            # 캐시 조회
            try:
                cached = client.get(cache_key)
                if cached:
                    logger.debug("Cache hit: %s", cache_key)
                    return json.loads(cached)
            except Exception as e:
                logger.warning("Cache read error: %s", str(e))
            
            # 원본 함수 실행
            result = func(*args, **kwargs)
            
            # 캐시 저장
            try:
                client.setex(cache_key, ttl, json.dumps(result, default=str))
                logger.debug("Cache set: %s (TTL: %d)", cache_key, ttl)
            except Exception as e:
                logger.warning("Cache write error: %s", str(e))
            
            return result
        return wrapper
    return decorator


def invalidate_cache(pattern: str) -> int:
    """패턴에 매칭되는 캐시 삭제
    
    Args:
        pattern: 삭제할 키 패턴 (예: "products:*")
    
    Returns:
        삭제된 키 개수
    """
    try:
        client = get_redis_client()
        keys = client.keys(pattern)
        if keys:
            deleted = client.delete(*keys)
            logger.info("Cache invalidated: %d keys matching '%s'", deleted, pattern)
            return deleted
        return 0
    except Exception as e:
        logger.warning("Cache invalidation error: %s", str(e))
        return 0


def cache_get(key: str) -> Optional[Any]:
    """단일 캐시 값 조회"""
    try:
        client = get_redis_client()
        cached = client.get(key)
        return json.loads(cached) if cached else None
    except Exception:
        return None


def cache_set(key: str, value: Any, ttl: int = 300) -> bool:
    """단일 캐시 값 저장"""
    try:
        client = get_redis_client()
        client.setex(key, ttl, json.dumps(value, default=str))
        return True
    except Exception:
        return False


def cache_delete(key: str) -> bool:
    """단일 캐시 값 삭제"""
    try:
        client = get_redis_client()
        client.delete(key)
        return True
    except Exception:
        return False

