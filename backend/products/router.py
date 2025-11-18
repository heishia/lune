from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.core.database import get_db

from . import schemas, service

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=schemas.ProductsResponse)
def get_products(
    category: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> schemas.ProductsResponse:
    products, total, total_pages = service.list_products(
        db=db,
        category=category,
        search=search,
        page=page,
        limit=limit,
    )
    return schemas.ProductsResponse(
        products=products,
        total=total,
        page=page,
        total_pages=total_pages,
    )


@router.get("/{product_id}", response_model=schemas.Product)
def get_product(product_id: int, db: Session = Depends(get_db)) -> schemas.Product:
    product = service.get_product(db, product_id=product_id)
    return product


@router.post("", response_model=schemas.Product)
def create_product(
    payload: schemas.CreateProductRequest,
    db: Session = Depends(get_db),
) -> schemas.Product:
    product = service.create_product(db, payload=payload)
    return product


@router.put("/{product_id}", response_model=schemas.Product)
def update_product(
    product_id: int,
    payload: schemas.UpdateProductRequest,
    db: Session = Depends(get_db),
) -> schemas.Product:
    product = service.update_product(db, product_id=product_id, payload=payload)
    return product


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)) -> dict:
    service.delete_product(db, product_id=product_id)
    return {"success": True}


