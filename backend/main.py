import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.auth.router import router as auth_router
from backend.core.config import get_settings
from backend.core.exceptions import DomainError
from backend.core.logger import configure_logging, get_logger
from backend.core.database import engine, get_db
from backend.products.router import router as products_router
from backend.cart.router import router as cart_router
from backend.orders.router import router as orders_router
from backend.kakao.router import router as kakao_router
from backend.instagram.router import router as instagram_router
from backend.banners.router import router as banners_router
from backend.coupons.router import router as coupons_router
from backend.admin.router import router as admin_router
from backend.contents.router import router as contents_router
from backend.uploads.router import router as uploads_router

settings = get_settings()
configure_logging()
logger = get_logger(__name__)

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

# CORS 설정 (다른 미들웨어보다 먼저 추가되어야 함)
# 개발 환경에서는 일반적인 개발 포트들을 모두 허용
cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",  # Vite 기본 포트
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
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


app.include_router(auth_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(kakao_router)
app.include_router(instagram_router)
app.include_router(banners_router)
app.include_router(coupons_router)
app.include_router(admin_router)
app.include_router(contents_router)
app.include_router(uploads_router)


