import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.core.config import get_settings
from backend.core.exceptions import DomainError
from backend.core.logger import configure_logging, get_logger
from backend.core.database import engine
from backend.core.rate_limit import limiter, rate_limit_exceeded_handler
from backend.api.v1.router import api_router

settings = get_settings()
configure_logging()
logger = get_logger(__name__)

# Sentry 초기화 (프로덕션 환경에서만)
if settings.sentry_dsn and settings.is_production:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
        
        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            integrations=[
                FastApiIntegration(transaction_style="endpoint"),
                SqlalchemyIntegration(),
            ],
            environment=settings.env,
            release=settings.app_version,
            traces_sample_rate=0.1,  # 10% 성능 모니터링
            profiles_sample_rate=0.1,  # 10% 프로파일링
            send_default_pii=False,  # 개인정보 전송 안함
        )
        logger.info("Sentry 모니터링 활성화됨: %s", settings.env)
    except ImportError:
        logger.warning("Sentry SDK not installed, monitoring disabled")
    except Exception as e:
        logger.error("Sentry 초기화 실패: %s", str(e))

# 서버 시작 로그 출력
logger.info("=" * 60)
logger.info("서버 시작 중...")
logger.info("애플리케이션: %s v%s", settings.app_name, settings.app_version)
logger.info("환경: %s (Debug: %s)", settings.env, settings.debug)

# 데이터베이스 연결 테스트
try:
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("데이터베이스 연결 성공!")
except Exception as e:
    logger.error("데이터베이스 연결 실패: %s", str(e))

logger.info("=" * 60)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
)

# Rate Limiting 설정
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# CORS 설정 (다른 미들웨어보다 먼저 추가되어야 함)
# 개발 환경 포트 + 프로덕션 도메인
cors_origins = [
    # Development
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",  # Vite 기본 포트
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    # Production
    "https://masionlune.com",
    "https://www.masionlune.com",
]

# 허용할 헤더 명시적 지정 (보안 강화)
cors_allowed_headers = [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control",
]

# 노출할 헤더 명시적 지정
cors_expose_headers = [
    "Content-Length",
    "Content-Type",
    "X-Request-Id",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=cors_allowed_headers,
    expose_headers=cors_expose_headers,
    max_age=600,  # Preflight 캐시 시간 (10분)
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """요청/응답 로깅 미들웨어"""
    start_time = time.time()
    
    # 요청 로깅
    logger.info(
        "%s %s - Client: %s",
        request.method,
        request.url.path,
        request.client.host if request.client else "unknown",
    )
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # 응답 로깅
        logger.info(
            "%s %s - Status: %d - Time: %.3fs",
            request.method,
            request.url.path,
            response.status_code,
            process_time,
        )
        
        return response
    except Exception as exc:
        process_time = time.time() - start_time
        logger.error(
            "%s %s - Exception: %s - Time: %.3fs",
            request.method,
            request.url.path,
            str(exc),
            process_time,
            exc_info=True,
        )
        raise


@app.exception_handler(DomainError)
async def handle_domain_error(request: Request, exc: DomainError) -> JSONResponse:  # type: ignore[override]
    logger.warning("Domain error: %s %s - Path: %s", exc.error_code, exc.message, request.url.path)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message, "code": exc.error_code},
    )


@app.exception_handler(Exception)
async def handle_general_exception(request: Request, exc: Exception) -> JSONResponse:
    """일반 예외 핸들러 (500 에러 등)"""
    logger.error(
        "Unhandled exception: %s - Path: %s",
        str(exc),
        request.url.path,
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "서버 내부 오류가 발생했습니다.",
            "code": "internal_server_error",
            "detail": str(exc) if settings.debug else None,
        },
    )


# API v1 라우터 등록 (새로운 방식: /api/v1/...)
app.include_router(api_router, prefix="/api/v1")

# 하위 호환성을 위한 기존 경로 유지 (기존 방식: /...)
# 향후 deprecated 예정
app.include_router(api_router)


