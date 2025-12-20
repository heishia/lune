"""위시리스트 스키마"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class FavoriteProductInfo(BaseModel):
    """찜한 상품 정보"""
    id: int
    name: str
    price: int
    original_price: Optional[int] = None
    image_url: str
    is_active: bool


class FavoriteResponse(BaseModel):
    """찜 응답"""
    id: str
    product_id: int
    created_at: datetime
    product: Optional[FavoriteProductInfo] = None


class FavoriteListResponse(BaseModel):
    """찜 목록 응답"""
    favorites: List[FavoriteResponse]
    total: int


class FavoriteToggleResponse(BaseModel):
    """찜 토글 응답"""
    is_favorited: bool
    message: str


class FavoriteStatusResponse(BaseModel):
    """찜 상태 응답"""
    is_favorited: bool
    favorite_count: int

