from typing import List, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.core import models
from backend.core.exceptions import NotFoundError

from . import schemas


def get_reviews(
    db: Session,
    product_id: int,
    limit: int = 4,
) -> Tuple[List[models.Review], int, float, int]:
    """상품의 후기 목록 조회"""
    reviews = (
        db.query(models.Review)
        .filter(
            models.Review.product_id == product_id,
        )
        .order_by(models.Review.created_at.desc())
        .limit(limit)
        .all()
    )

    # 전체 후기 통계
    total_reviews = (
        db.query(func.count(models.Review.id))
        .filter(
            models.Review.product_id == product_id,
        )
        .scalar()
        or 0
    )

    avg_rating = (
        db.query(func.avg(models.Review.rating))
        .filter(
            models.Review.product_id == product_id,
        )
        .scalar()
        or 0.0
    )

    return reviews, total_reviews, float(avg_rating) if avg_rating else 0.0, total_reviews


def create_review(
    db: Session,
    user_id: str,
    payload: schemas.CreateReviewRequest,
) -> models.Review:
    """후기 작성"""
    # 상품 존재 확인
    product = db.query(models.Product).filter(models.Product.id == payload.product_id).first()
    if not product:
        raise NotFoundError("상품을 찾을 수 없습니다.")

    import uuid
    review = models.Review(
        id=str(uuid.uuid4()),
        product_id=payload.product_id,
        user_id=user_id,
        order_item_id=payload.order_item_id,
        rating=payload.rating,
        content=payload.content,
        images=payload.images or [],
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def update_review(
    db: Session,
    review_id: str,
    user_id: str,
    payload: schemas.UpdateReviewRequest,
) -> models.Review:
    """후기 수정"""
    review = (
        db.query(models.Review)
        .filter(models.Review.id == review_id, models.Review.user_id == user_id)
        .first()
    )
    if not review:
        raise NotFoundError("후기를 찾을 수 없습니다.")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(review, field, value)

    db.commit()
    db.refresh(review)
    return review


def delete_review(db: Session, review_id: str, user_id: str) -> None:
    """후기 삭제"""
    review = (
        db.query(models.Review)
        .filter(models.Review.id == review_id, models.Review.user_id == user_id)
        .first()
    )
    if not review:
        raise NotFoundError("후기를 찾을 수 없습니다.")

    db.delete(review)
    db.commit()


def get_favorite_count(db: Session, product_id: int) -> int:
    """상품의 찜 개수 조회"""
    count = (
        db.query(func.count(models.Favorite.id))
        .filter(models.Favorite.product_id == product_id)
        .scalar()
        or 0
    )
    return count

