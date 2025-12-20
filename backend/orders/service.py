from __future__ import annotations

from datetime import datetime
from typing import List, Tuple
from uuid import uuid4

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.core import models
from backend.core.exceptions import NotFoundError, BadRequestError

from . import schemas


def _generate_order_number() -> str:
    now = datetime.utcnow()
    return now.strftime("%Y%m%d") + "-" + uuid4().hex[:8].upper()


def create_order(
    db: Session,
    user_id: str,
    payload: schemas.CreateOrderRequest,
) -> schemas.CreateOrderResponse:
    """주문 생성 (재고 확인 및 차감 포함)"""
    if not payload.items:
        raise BadRequestError("주문 상품이 존재하지 않습니다.")

    total_amount = 0
    order_items: List[models.OrderItem] = []
    products_to_update: List[tuple[models.Product, int]] = []  # (상품, 차감 수량)

    # 1단계: 재고 확인 및 주문 아이템 준비
    for item in payload.items:
        product = db.query(models.Product).filter(models.Product.id == item.productId).first()
        if not product:
            raise NotFoundError(f"상품 ID {item.productId}를 찾을 수 없습니다.")
        
        # 상품 활성화 상태 확인
        if not product.is_active:
            raise BadRequestError(f"'{product.name}' 상품은 현재 판매하지 않습니다.")
        
        # 재고 확인
        if product.stock_quantity < item.quantity:
            raise BadRequestError(
                f"'{product.name}' 재고가 부족합니다. "
                f"(요청: {item.quantity}개, 재고: {product.stock_quantity}개)"
            )
        
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
        products_to_update.append((product, item.quantity))

    # 2단계: 재고 차감 (트랜잭션 내에서)
    for product, quantity in products_to_update:
        product.stock_quantity -= quantity
        product.updated_at = datetime.utcnow()

    shipping_fee = 0 if total_amount >= 50000 else 3000
    discount_amount = max(payload.discountAmount, 0)
    final_amount = total_amount + shipping_fee - discount_amount

    # 3단계: 주문 생성
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
    """주문 취소 (재고 복구 포함)"""
    order = get_order(db=db, user_id=user_id, order_id=order_id)
    if order.status not in {"pending", "paid", "preparing"}:
        raise BadRequestError("취소할 수 없는 주문 상태입니다.")

    # 주문 아이템 조회
    order_items = db.query(models.OrderItem).filter(
        models.OrderItem.order_id == order_id
    ).all()
    
    # 재고 복구
    for item in order_items:
        product = db.query(models.Product).filter(
            models.Product.id == item.product_id
        ).first()
        if product:
            product.stock_quantity += item.quantity
            product.updated_at = datetime.utcnow()

    order.status = "cancelled"
    order.cancel_reason = reason
    order.cancelled_at = datetime.utcnow()
    order.updated_at = datetime.utcnow()
    db.commit()


