"""위시리스트 서비스"""
from datetime import datetime
from typing import List, Optional, Tuple
from uuid import uuid4

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from backend.core import models
from backend.core.exceptions import NotFoundError, BadRequestError


def get_user_favorites(
    db: Session,
    user_id: str,
    limit: int = 50,
    offset: int = 0,
) -> Tuple[List[models.Favorite], int]:
    """사용자의 찜 목록 조회"""
    query = db.query(models.Favorite).filter(
        models.Favorite.user_id == user_id
    )
    
    total = query.with_entities(func.count(models.Favorite.id)).scalar() or 0
    
    favorites = (
        query
        .options(joinedload(models.Favorite.product))
        .order_by(models.Favorite.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    return favorites, total


def is_favorited(
    db: Session,
    user_id: str,
    product_id: int,
) -> bool:
    """상품이 찜되어 있는지 확인"""
    return db.query(
        db.query(models.Favorite).filter(
            models.Favorite.user_id == user_id,
            models.Favorite.product_id == product_id,
        ).exists()
    ).scalar()


def get_favorite_count(
    db: Session,
    product_id: int,
) -> int:
    """상품의 찜 수 조회"""
    return db.query(func.count(models.Favorite.id)).filter(
        models.Favorite.product_id == product_id
    ).scalar() or 0


def add_to_favorites(
    db: Session,
    user_id: str,
    product_id: int,
) -> models.Favorite:
    """찜 추가"""
    # 상품 존재 확인
    product = db.query(models.Product).filter(
        models.Product.id == product_id
    ).first()
    if not product:
        raise NotFoundError("상품을 찾을 수 없습니다.")
    
    # 이미 찜한 경우 확인
    existing = db.query(models.Favorite).filter(
        models.Favorite.user_id == user_id,
        models.Favorite.product_id == product_id,
    ).first()
    
    if existing:
        raise BadRequestError("이미 찜한 상품입니다.")
    
    favorite = models.Favorite(
        id=str(uuid4()),
        user_id=user_id,
        product_id=product_id,
        created_at=datetime.utcnow(),
    )
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    
    return favorite


def remove_from_favorites(
    db: Session,
    user_id: str,
    product_id: int,
) -> None:
    """찜 제거"""
    favorite = db.query(models.Favorite).filter(
        models.Favorite.user_id == user_id,
        models.Favorite.product_id == product_id,
    ).first()
    
    if not favorite:
        raise NotFoundError("찜한 상품이 아닙니다.")
    
    db.delete(favorite)
    db.commit()


def toggle_favorite(
    db: Session,
    user_id: str,
    product_id: int,
) -> Tuple[bool, str]:
    """찜 토글 (있으면 제거, 없으면 추가)
    
    Returns:
        (is_favorited, message) 튜플
    """
    existing = db.query(models.Favorite).filter(
        models.Favorite.user_id == user_id,
        models.Favorite.product_id == product_id,
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        return False, "찜 목록에서 제거되었습니다."
    else:
        # 상품 존재 확인
        product = db.query(models.Product).filter(
            models.Product.id == product_id
        ).first()
        if not product:
            raise NotFoundError("상품을 찾을 수 없습니다.")
        
        favorite = models.Favorite(
            id=str(uuid4()),
            user_id=user_id,
            product_id=product_id,
            created_at=datetime.utcnow(),
        )
        db.add(favorite)
        db.commit()
        return True, "찜 목록에 추가되었습니다."

