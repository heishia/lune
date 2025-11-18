from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from backend.auth.router import router as auth_router
from backend.core.config import get_settings
from backend.core.exceptions import DomainError
from backend.core.logger import configure_logging, get_logger
from backend.products.router import router as products_router
from backend.cart.router import router as cart_router
from backend.orders.router import router as orders_router
from backend.kakao.router import router as kakao_router

settings = get_settings()
configure_logging()
logger = get_logger(__name__)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
)


@app.exception_handler(DomainError)
async def handle_domain_error(request: Request, exc: DomainError) -> JSONResponse:  # type: ignore[override]
    logger.warning("Domain error: %s %s", exc.error_code, exc.message)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message, "code": exc.error_code},
    )


app.include_router(auth_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(kakao_router)


