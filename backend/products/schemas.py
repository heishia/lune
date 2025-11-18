from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: int = Field(..., ge=0)
    original_price: Optional[int] = Field(default=None, ge=0)
    category: List[str]
    colors: List[str]
    sizes: List[str]
    image_url: str
    stock_quantity: int = Field(0, ge=0)
    is_new: bool = False
    is_best: bool = False
    is_active: bool = True


class Product(ProductBase):
    id: int
    view_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductsResponse(BaseModel):
    products: List[Product]
    total: int
    page: int
    total_pages: int


class CreateProductRequest(ProductBase):
    pass


class UpdateProductRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = Field(default=None, ge=0)
    original_price: Optional[int] = Field(default=None, ge=0)
    category: Optional[List[str]] = None
    colors: Optional[List[str]] = None
    sizes: Optional[List[str]] = None
    image_url: Optional[str] = None
    stock_quantity: Optional[int] = Field(default=None, ge=0)
    is_new: Optional[bool] = None
    is_best: Optional[bool] = None
    is_active: Optional[bool] = None


