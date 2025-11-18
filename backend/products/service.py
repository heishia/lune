from typing import List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.core import models
from backend.core.exceptions import NotFoundError

from . import schemas


def list_products(
    db: Session,
    category: Optional[str],
    search: Optional[str],
    page: int,
    limit: int,
) -> Tuple[List[models.Product], int, int]:
    query = db.query(models.Product).filter(models.Product.is_active.is_(True))

    if category:
        query = query.filter(models.Product.category.any(category))

    if search:
        pattern = f"%{search}%"
        query = query.filter(models.Product.name.ilike(pattern))

    total = query.with_entities(func.count(models.Product.id)).scalar() or 0

    page = max(page, 1)
    limit = max(min(limit, 100), 1)
    offset = (page - 1) * limit

    products = (
        query.order_by(models.Product.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return products, total, total_pages


def get_product(db: Session, product_id: int) -> models.Product:
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise NotFoundError("상품을 찾을 수 없습니다.")
    return product


def create_product(db: Session, payload: schemas.CreateProductRequest) -> models.Product:
    product = models.Product(
        name=payload.name,
        description=payload.description,
        price=payload.price,
        original_price=payload.original_price,
        category=payload.category,
        colors=payload.colors,
        sizes=payload.sizes,
        image_url=payload.image_url,
        stock_quantity=payload.stock_quantity,
        is_new=payload.is_new,
        is_best=payload.is_best,
        is_active=payload.is_active,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(
    db: Session,
    product_id: int,
    payload: schemas.UpdateProductRequest,
) -> models.Product:
    product = get_product(db, product_id)

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int) -> None:
    product = get_product(db, product_id)
    db.delete(product)
    db.commit()


