from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class OrderItemPayload(BaseModel):
    productId: int
    quantity: int = Field(..., ge=1)
    color: str
    size: str


class ShippingAddressPayload(BaseModel):
    recipientName: str
    phone: str
    postalCode: str
    address: str
    addressDetail: Optional[str] = None
    deliveryMessage: Optional[str] = None


class CreateOrderRequest(BaseModel):
    items: List[OrderItemPayload]
    shippingAddress: ShippingAddressPayload
    paymentMethod: str
    discountAmount: int = 0


class OrderSummary(BaseModel):
    id: str
    order_number: str
    status: str
    total_amount: int
    discount_amount: int
    shipping_fee: int
    final_amount: int
    recipient_name: str
    recipient_phone: str
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderDetail(OrderSummary):
    postal_code: str
    address: str
    address_detail: Optional[str] = None
    delivery_message: Optional[str] = None
    payment_method: str
    payment_status: str
    items: List[dict] = Field(default_factory=list)


class CreateOrderResponse(BaseModel):
    orderId: str
    orderNumber: str
    totalAmount: int


class OrdersResponse(BaseModel):
    orders: List[OrderSummary]
    total: int
    page: int
    totalPages: int


