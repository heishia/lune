"""Repository 모듈

데이터 접근 계층을 추상화하여 서비스 계층과 분리합니다.
"""
from .base import BaseRepository
from .user_repository import UserRepository
from .product_repository import ProductRepository
from .order_repository import OrderRepository

__all__ = [
    "BaseRepository",
    "UserRepository",
    "ProductRepository",
    "OrderRepository",
]

