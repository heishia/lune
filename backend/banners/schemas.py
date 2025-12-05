from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel


class ContentBlock(BaseModel):
    type: str  # "text" or "image"
    content: str


class BannerBase(BaseModel):
    title: str
    banner_image: str
    content_blocks: List[ContentBlock] = []
    is_active: bool = True
    display_order: int = 0


class CreateBannerRequest(BannerBase):
    pass


class UpdateBannerRequest(BaseModel):
    title: Optional[str] = None
    banner_image: Optional[str] = None
    content_blocks: Optional[List[ContentBlock]] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class BannerResponse(BannerBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BannersListResponse(BaseModel):
    banners: List[BannerResponse]
    total: int

