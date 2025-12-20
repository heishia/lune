"""Rate Limiting 모듈

API 요청 속도 제한을 구현합니다.
Redis를 사용한 분산 환경에서의 속도 제한을 지원합니다.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from fastapi import Request
from fastapi.responses import JSONResponse

from .config import get_settings
from .logger import get_logger

logger = get_logger(__name__)
settings = get_settings()


def get_client_ip(request: Request) -> str:
    """클라이언트 IP 추출 (프록시 고려)"""
    # X-Forwarded-For 헤더 확인 (프록시/로드밸런서 뒤에 있을 때)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # 첫 번째 IP가 실제 클라이언트 IP
        return forwarded.split(",")[0].strip()
    
    # X-Real-IP 헤더 확인
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # 기본 클라이언트 IP
    return request.client.host if request.client else "unknown"


def get_rate_limit_key(request: Request) -> str:
    """Rate limit 키 생성
    
    인증된 사용자는 user_id 기반, 미인증은 IP 기반
    """
    # Authorization 헤더에서 사용자 ID 추출 시도
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            from .security import decode_access_token
            token = auth_header.split(" ")[1]
            payload = decode_access_token(token)
            user_id = payload.get("sub")
            if user_id:
                return f"user:{user_id}"
        except Exception:
            pass
    
    # 미인증 사용자는 IP 기반
    return f"ip:{get_client_ip(request)}"


# Redis URL이 있으면 Redis 사용, 없으면 메모리 사용
storage_uri = settings.redis_url if settings.redis_url else "memory://"

# Limiter 인스턴스 생성
limiter = Limiter(
    key_func=get_rate_limit_key,
    storage_uri=storage_uri,
    strategy="fixed-window",  # 또는 "moving-window"
    default_limits=["200/minute"],  # 기본 제한: 분당 200회
)

logger.info("Rate Limiter 초기화: storage=%s", 
            "Redis" if "redis" in storage_uri else "Memory")


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Rate limit 초과 시 핸들러"""
    client_ip = get_client_ip(request)
    logger.warning(
        "Rate limit exceeded: %s %s from %s - Limit: %s",
        request.method,
        request.url.path,
        client_ip,
        exc.detail,
    )
    
    return JSONResponse(
        status_code=429,
        content={
            "error": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
            "code": "rate_limit_exceeded",
            "retry_after": getattr(exc, "retry_after", 60),
        },
        headers={
            "Retry-After": str(getattr(exc, "retry_after", 60)),
            "X-RateLimit-Limit": str(exc.detail) if exc.detail else "unknown",
        }
    )


# 자주 사용되는 제한 정의
RATE_LIMITS = {
    # 인증 관련 (보안상 엄격하게)
    "auth_login": "5/minute",        # 로그인: 분당 5회
    "auth_signup": "3/minute",       # 회원가입: 분당 3회
    "auth_password_reset": "3/hour", # 비밀번호 재설정: 시간당 3회
    
    # 일반 API
    "api_default": "60/minute",      # 기본: 분당 60회
    "api_search": "30/minute",       # 검색: 분당 30회
    "api_create": "20/minute",       # 생성: 분당 20회
    
    # 결제 관련
    "payment": "10/minute",          # 결제: 분당 10회
    
    # 파일 업로드
    "upload": "10/minute",           # 업로드: 분당 10회
}


def get_limit(limit_name: str) -> str:
    """이름으로 제한 규칙 가져오기"""
    return RATE_LIMITS.get(limit_name, RATE_LIMITS["api_default"])

