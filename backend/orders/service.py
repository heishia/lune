from __future__ import annotations

from datetime import datetime
from typing import List, Tuple
from uuid import uuid4

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.core import models
from backend.core.exceptions import NotFoundError

from . import schemas


def _generate_order_number() -> str:
    now = datetime.utcnow()
    return now.strftime("%Y%m%d") + "-" + uuid4().hex[:8].upper()


def create_order(
    db: Session,
    user_id: str,
    payload: schemas.CreateOrderRequest,
) -> schemas.CreateOrderResponse:
    if not payload.items:
        raise NotFoundError("주문 상품이 존재하지 않습니다.")

    total_amount = 0
    order_items: List[models.OrderItem] = []

    for item in payload.items:
        product = db.query(models.Product).filter(models.Product.id == item.productId).first()
        if not product:
            raise NotFoundError("상품을 찾을 수 없습니다.")
        line_total = product.price * item.quantity
        total_amount += line_total

        order_item = models.OrderItem(
            id=str(uuid4()),
            product_id=product.id,
            product_name=product.name,
            product_image=product.image_url,
            quantity=item.quantity,
            color=item.color,
            size=item.size,
            price=product.price,
            created_at=datetime.utcnow(),
        )
        order_items.append(order_item)

    shipping_fee = 0 if total_amount >= 50000 else 3000
    discount_amount = max(payload.discountAmount, 0)
    final_amount = total_amount + shipping_fee - discount_amount

    order = models.Order(
        id=str(uuid4()),
        user_id=user_id,
        order_number=_generate_order_number(),
        status="pending",
        total_amount=total_amount,
        discount_amount=discount_amount,
        shipping_fee=shipping_fee,
        final_amount=final_amount,
        recipient_name=payload.shippingAddress.recipientName,
        recipient_phone=payload.shippingAddress.phone,
        postal_code=payload.shippingAddress.postalCode,
        address=payload.shippingAddress.address,
        address_detail=payload.shippingAddress.addressDetail,
        delivery_message=payload.shippingAddress.deliveryMessage,
        payment_method=payload.paymentMethod,
        payment_status="pending",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(order)
    db.flush()

    for order_item in order_items:
        order_item.order_id = order.id
        db.add(order_item)

    db.commit()

    return schemas.CreateOrderResponse(
        orderId=str(order.id),
        orderNumber=order.order_number,
        totalAmount=order.final_amount,
    )


def list_orders(
    db: Session,
    user_id: str,
    page: int,
    limit: int,
    status_filter: str | None,
) -> Tuple[List[models.Order], int, int]:
    query = db.query(models.Order).filter(models.Order.user_id == user_id)
    if status_filter:
        query = query.filter(models.Order.status == status_filter)

    total = query.with_entities(func.count(models.Order.id)).scalar() or 0
    page = max(page, 1)
    limit = max(min(limit, 100), 1)
    offset = (page - 1) * limit

    orders = (
        query.order_by(models.Order.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return orders, total, total_pages


def get_order(db: Session, user_id: str, order_id: str) -> models.Order:
    order = (
        db.query(models.Order)
        .filter(models.Order.id == order_id, models.Order.user_id == user_id)
        .first()
    )
    if not order:
        raise NotFoundError("주문을 찾을 수 없습니다.")
    return order


def cancel_order(db: Session, user_id: str, order_id: str, reason: str) -> None:
    order = get_order(db=db, user_id=user_id, order_id=order_id)
    if order.status not in {"pending", "paid", "preparing"}:
        raise NotFoundError("취소할 수 없는 주문 상태입니다.")

    order.status = "cancelled"
    order.updated_at = datetime.utcnow()
    db.commit()


