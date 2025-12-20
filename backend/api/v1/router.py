"""API v1 라우터 통합

모든 v1 엔드포인트를 하나의 라우터로 통합합니다.
"""
from fastapi import APIRouter

from backend.auth.router import router as auth_router
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
from backend.reviews.router import router as reviews_router
from backend.favorites.router import router as favorites_router
from backend.notifications.router import router as notifications_router
from backend.inquiries.router import router as inquiries_router

# v1 통합 라우터
api_router = APIRouter()

# 각 도메인 라우터 등록
api_router.include_router(auth_router, tags=["Auth"])
api_router.include_router(products_router, tags=["Products"])
api_router.include_router(cart_router, tags=["Cart"])
api_router.include_router(orders_router, tags=["Orders"])
api_router.include_router(kakao_router, tags=["Kakao"])
api_router.include_router(instagram_router, tags=["Instagram"])
api_router.include_router(banners_router, tags=["Banners"])
api_router.include_router(coupons_router, tags=["Coupons"])
api_router.include_router(admin_router, tags=["Admin"])
api_router.include_router(contents_router, tags=["Contents"])
api_router.include_router(uploads_router, tags=["Uploads"])
api_router.include_router(reviews_router, tags=["Reviews"])
api_router.include_router(favorites_router, tags=["Favorites"])
api_router.include_router(notifications_router, tags=["Notifications"])
api_router.include_router(inquiries_router, tags=["Inquiries"])

