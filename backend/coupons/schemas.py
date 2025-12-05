from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class CouponBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    discount_type: str  # "percentage" or "fixed_amount"
    discount_value: int
    min_purchase_amount: int = 0
    max_discount_amount: Optional[int] = None
    valid_from: datetime
    valid_until: datetime
    usage_limit: Optional[int] = None
    is_active: bool = True


class CreateCouponRequest(CouponBase):
    pass


class UpdateCouponRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[int] = None
    min_purchase_amount: Optional[int] = None
    max_discount_amount: Optional[int] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    usage_limit: Optional[int] = None
    is_active: Optional[bool] = None


class CouponResponse(CouponBase):
    id: str
    usage_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class CouponsListResponse(BaseModel):
    coupons: List[CouponResponse]
    total: int


class IssueCouponRequest(BaseModel):
    user_id: str


class UserCouponResponse(BaseModel):
    id: str
    coupon_id: str
    coupon_name: str
    coupon_code: str
    discount_type: str
    discount_value: int
    valid_until: datetime
    is_used: bool
    used_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserCouponsListResponse(BaseModel):
    coupons: List[UserCouponResponse]
    total: int

