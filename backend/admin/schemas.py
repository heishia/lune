from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


# 관리자용 주문 관련 스키마
class AdminOrderItem(BaseModel):
    id: str
    product_name: str
    product_image: Optional[str] = None
    quantity: int
    color: str
    size: str
    price: int


class AdminOrderResponse(BaseModel):
    id: str
    order_number: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    status: str
    total_amount: int
    discount_amount: int
    shipping_fee: int
    final_amount: int
    recipient_name: str
    recipient_phone: str
    postal_code: str
    address: str
    address_detail: Optional[str] = None
    delivery_message: Optional[str] = None
    payment_method: str
    payment_status: str
    tracking_number: Optional[str] = None
    courier: Optional[str] = None
    created_at: datetime
    items: List[AdminOrderItem] = []

    class Config:
        from_attributes = True


class AdminOrdersListResponse(BaseModel):
    orders: List[AdminOrderResponse]
    total: int
    page: int
    total_pages: int


class UpdateOrderStatusRequest(BaseModel):
    status: str  # pending, paid, preparing, shipped, delivered, cancelled
    tracking_number: Optional[str] = None
    courier: Optional[str] = None


# 사용자 검색 관련 스키마
class UserSearchResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: str
    points: int
    is_active: bool
    marketing_agreed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UsersSearchListResponse(BaseModel):
    users: List[UserSearchResponse]
    total: int


# 포인트 지급 스키마
class IssuePointsRequest(BaseModel):
    points: int
    reason: str


class PointHistoryResponse(BaseModel):
    id: str
    user_id: str
    points: int
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True


class PointHistoryListResponse(BaseModel):
    history: List[PointHistoryResponse]
    total: int

