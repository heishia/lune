from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.core import models
from backend.core.database import get_db
from backend.core.security import get_current_user_id

from . import schemas, service

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/product/{product_id}", response_model=schemas.ReviewsResponse)
def get_product_reviews(
    product_id: int,
    limit: int = Query(4, ge=1, le=100),
    db: Session = Depends(get_db),
) -> schemas.ReviewsResponse:
    """상품의 후기 목록 조회"""
    reviews, total, avg_rating, total_ratings = service.get_reviews(
        db=db,
        product_id=product_id,
        limit=limit,
    )

    # 사용자 이름 포함하여 반환
    review_list = []
    for review in reviews:
        user = db.query(models.User).filter(models.User.id == review.user_id).first()
        review_list.append(
            schemas.Review(
                id=str(review.id),
                product_id=review.product_id,
                user_id=str(review.user_id),
                user_name=user.name if user else "Unknown",
                order_item_id=str(review.order_item_id) if review.order_item_id else None,
                rating=review.rating,
                content=review.content,
                images=review.images or [],
                helpful_count=review.helpful_count,
                created_at=review.created_at,
                updated_at=review.updated_at,
            )
        )

    return schemas.ReviewsResponse(
        reviews=review_list,
        total=total,
        average_rating=avg_rating,
        total_ratings=total_ratings,
    )


@router.post("", response_model=schemas.Review)
def create_review(
    payload: schemas.CreateReviewRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> schemas.Review:
    """후기 작성"""
    review = service.create_review(db=db, user_id=user_id, payload=payload)
    user = db.query(models.User).filter(models.User.id == review.user_id).first()
    return schemas.Review(
        id=str(review.id),
        product_id=review.product_id,
        user_id=str(review.user_id),
        user_name=user.name if user else "Unknown",
        order_item_id=str(review.order_item_id) if review.order_item_id else None,
        rating=review.rating,
        content=review.content,
        images=review.images or [],
        helpful_count=review.helpful_count,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


@router.put("/{review_id}", response_model=schemas.Review)
def update_review(
    review_id: str,
    payload: schemas.UpdateReviewRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> schemas.Review:
    """후기 수정"""
    review = service.update_review(db=db, review_id=review_id, user_id=user_id, payload=payload)
    user = db.query(models.User).filter(models.User.id == review.user_id).first()
    return schemas.Review(
        id=str(review.id),
        product_id=review.product_id,
        user_id=str(review.user_id),
        user_name=user.name if user else "Unknown",
        order_item_id=str(review.order_item_id) if review.order_item_id else None,
        rating=review.rating,
        content=review.content,
        images=review.images or [],
        helpful_count=review.helpful_count,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


@router.delete("/{review_id}")
def delete_review(
    review_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    """후기 삭제"""
    service.delete_review(db=db, review_id=review_id, user_id=user_id)
    return {"success": True}


@router.get("/product/{product_id}/favorites/count")
def get_favorite_count(
    product_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """상품의 찜 개수 조회"""
    count = service.get_favorite_count(db=db, product_id=product_id)
    return {"count": count}


@router.get("/product/{product_id}/can-review")
def can_review_product(
    product_id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    """사용자가 해당 상품에 리뷰를 작성할 수 있는지 확인"""
    return service.can_user_review_product(db=db, user_id=user_id, product_id=product_id)

