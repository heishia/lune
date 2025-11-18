from __future__ import annotations

from datetime import datetime
from typing import List
from uuid import uuid4

from sqlalchemy.orm import Session, joinedload

from backend.core import models
from backend.core.exceptions import NotFoundError

from . import schemas


def get_cart_items(db: Session, user_id: str) -> List[schemas.CartItem]:
    carts = (
        db.query(models.Cart)
        .options(joinedload(models.Cart.product))
        .filter(models.Cart.user_id == user_id)
        .order_by(models.Cart.created_at.desc())
        .all()
    )

    items: List[schemas.CartItem] = []
    for cart in carts:
        if cart.product is None:
            continue
        items.append(
            schemas.CartItem(
                id=str(cart.id),
                product_id=cart.product_id,
                quantity=cart.quantity,
                color=cart.color,
                size=cart.size,
                created_at=cart.created_at or datetime.utcnow(),
                products=schemas.Product.from_orm(cart.product),
            )
        )
    return items


def add_to_cart(db: Session, user_id: str, payload: schemas.AddToCartRequest) -> schemas.CartItem:
    product = db.query(models.Product).filter(models.Product.id == payload.productId).first()
    if not product:
        raise NotFoundError("상품을 찾을 수 없습니다.")

    cart = (
        db.query(models.Cart)
        .filter(
            models.Cart.user_id == user_id,
            models.Cart.product_id == payload.productId,
            models.Cart.color == payload.color,
            models.Cart.size == payload.size,
        )
        .first()
    )

    if cart:
        cart.quantity += payload.quantity
        cart.updated_at = datetime.utcnow()
    else:
        cart = models.Cart(
            id=str(uuid4()),
            user_id=user_id,
            product_id=payload.productId,
            quantity=payload.quantity,
            color=payload.color,
            size=payload.size,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(cart)

    db.commit()
    db.refresh(cart)

    return schemas.CartItem(
        id=str(cart.id),
        product_id=cart.product_id,
        quantity=cart.quantity,
        color=cart.color,
        size=cart.size,
        created_at=cart.created_at or datetime.utcnow(),
        products=schemas.Product.from_orm(product),
    )


def update_cart_quantity(db: Session, user_id: str, cart_id: str, quantity: int) -> schemas.CartItem:
    cart = (
        db.query(models.Cart)
        .options(joinedload(models.Cart.product))
        .filter(models.Cart.id == cart_id, models.Cart.user_id == user_id)
        .first()
    )
    if not cart:
        raise NotFoundError("장바구니 항목을 찾을 수 없습니다.")

    cart.quantity = quantity
    cart.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(cart)

    if cart.product is None:
        raise NotFoundError("상품을 찾을 수 없습니다.")

    return schemas.CartItem(
        id=str(cart.id),
        product_id=cart.product_id,
        quantity=cart.quantity,
        color=cart.color,
        size=cart.size,
        created_at=cart.created_at or datetime.utcnow(),
        products=schemas.Product.from_orm(cart.product),
    )


def remove_cart_item(db: Session, user_id: str, cart_id: str) -> None:
    cart = (
        db.query(models.Cart)
        .filter(models.Cart.id == cart_id, models.Cart.user_id == user_id)
        .first()
    )
    if not cart:
        raise NotFoundError("장바구니 항목을 찾을 수 없습니다.")

    db.delete(cart)
    db.commit()


def clear_cart(db: Session, user_id: str) -> None:
    db.query(models.Cart).filter(models.Cart.user_id == user_id).delete()
    db.commit()


