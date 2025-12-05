from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel


class ContentBlock(BaseModel):
    """에디터 블록 데이터 구조"""
    id: str
    type: str  # "text", "image", "heading", "divider", "quote", etc.
    data: dict  # 블록별 데이터


class ContentBase(BaseModel):
    title: str
    content_type: str = "product"  # product, banner, post
    reference_id: Optional[str] = None
    blocks: List[ContentBlock] = []
    thumbnail_url: Optional[str] = None
    is_published: bool = False


class CreateContentRequest(ContentBase):
    pass


class UpdateContentRequest(BaseModel):
    title: Optional[str] = None
    blocks: Optional[List[ContentBlock]] = None
    thumbnail_url: Optional[str] = None
    is_published: Optional[bool] = None


class ContentResponse(ContentBase):
    id: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContentsListResponse(BaseModel):
    contents: List[ContentResponse]
    total: int

