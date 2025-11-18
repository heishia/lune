from datetime import datetime
from typing import List

from pydantic import BaseModel, Field

from backend.products.schemas import Product


class CartItem(BaseModel):
    id: str
    product_id: int
    quantity: int = Field(..., ge=1)
    color: str
    size: str
    created_at: datetime
    products: Product

    model_config = {"from_attributes": True}


class CartResponse(BaseModel):
    items: List[CartItem]


class AddToCartRequest(BaseModel):
    productId: int
    quantity: int = Field(..., ge=1)
    color: str
    size: str


class UpdateCartQuantityRequest(BaseModel):
    quantity: int = Field(..., ge=1)


class CartItemWrapper(BaseModel):
    item: CartItem


