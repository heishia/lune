from typing import Optional
from pydantic import BaseModel


class InstagramSettingsResponse(BaseModel):
    access_token: str
    has_token: bool
    featured_image_url: Optional[str] = None


class InstagramSettingsUpdate(BaseModel):
    accessToken: Optional[str] = None
    featuredImageUrl: Optional[str] = None
    imageUrl: Optional[str] = None  # 프론트엔드 호환성


class InstagramMediaItem(BaseModel):
    id: str
    imageUrl: str
    caption: str
    permalink: str


class InstagramMediaResponse(BaseModel):
    featuredImageUrl: Optional[str] = None
    media: list[InstagramMediaItem] = []

