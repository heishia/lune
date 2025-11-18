from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import get_current_user_id

from . import schemas, service

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=schemas.CreateOrderResponse)
def create_order(
    payload: schemas.CreateOrderRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> schemas.CreateOrderResponse:
    return service.create_order(db=db, user_id=user_id, payload=payload)


@router.get("", response_model=schemas.OrdersResponse)
def get_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(default=None),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> schemas.OrdersResponse:
    orders, total, total_pages = service.list_orders(
        db=db,
        user_id=user_id,
        page=page,
        limit=limit,
        status_filter=status,
    )
    summaries = [
        schemas.OrderSummary.from_orm(order)
        for order in orders
    ]
    return schemas.OrdersResponse(
        orders=summaries,
        total=total,
        page=page,
        totalPages=total_pages,  # type: ignore[arg-type]
    )


@router.get("/{order_id}", response_model=schemas.OrderDetail)
def get_order(
    order_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> schemas.OrderDetail:
    order = service.get_order(db=db, user_id=user_id, order_id=order_id)
    return schemas.OrderDetail(
        id=str(order.id),
        order_number=order.order_number,
        status=order.status,
        total_amount=order.total_amount,
        discount_amount=order.discount_amount,
        shipping_fee=order.shipping_fee,
        final_amount=order.final_amount,
        recipient_name=order.recipient_name,
        recipient_phone=order.recipient_phone,
        created_at=order.created_at,
        postal_code=order.postal_code,
        address=order.address,
        address_detail=order.address_detail,
        delivery_message=order.delivery_message,
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        items=[],
    )


@router.put("/{order_id}/cancel")
def cancel_order(
    order_id: str,
    payload: dict,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    reason = str(payload.get("reason", ""))
    service.cancel_order(db=db, user_id=user_id, order_id=order_id, reason=reason)
    return {"success": True}


