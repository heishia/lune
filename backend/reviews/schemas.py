from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    content: Optional[str] = None
    images: List[str] = []


class Review(ReviewBase):
    id: str
    product_id: int
    user_id: str
    user_name: str
    order_item_id: Optional[str] = None
    helpful_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReviewsResponse(BaseModel):
    reviews: List[Review]
    total: int
    average_rating: float
    total_ratings: int


class CreateReviewRequest(ReviewBase):
    product_id: int
    order_item_id: Optional[str] = None


class UpdateReviewRequest(BaseModel):
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    content: Optional[str] = None
    images: Optional[List[str]] = None

