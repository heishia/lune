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
    """후기 작성 - 구매한 사람만 작성 가능"""
    from backend.core.exceptions import DomainError
    
    # 상품 존재 확인
    product = db.query(models.Product).filter(models.Product.id == payload.product_id).first()
    if not product:
        raise NotFoundError("상품을 찾을 수 없습니다.")

    # 주문 상품 확인
    order_item = None
    if payload.order_item_id:
        # order_item_id가 제공된 경우
        order_item = (
            db.query(models.OrderItem)
            .join(models.Order)
            .filter(
                models.OrderItem.id == payload.order_item_id,
                models.Order.user_id == user_id,
                models.OrderItem.product_id == payload.product_id,
                models.Order.status.in_(["completed", "delivered"]),  # 배송 완료된 주문만
            )
            .first()
        )
    else:
        # order_item_id가 없는 경우, 사용자의 주문 내역에서 해당 상품 찾기
        order_item = (
            db.query(models.OrderItem)
            .join(models.Order)
            .filter(
                models.Order.user_id == user_id,
                models.OrderItem.product_id == payload.product_id,
                models.Order.status.in_(["completed", "delivered"]),
            )
            .order_by(models.OrderItem.created_at.desc())
            .first()
        )

    if not order_item:
        from backend.core.exceptions import ForbiddenError
        raise ForbiddenError("구매한 상품에만 리뷰를 작성할 수 있습니다.")

    # 이미 리뷰를 작성했는지 확인
    existing_review = (
        db.query(models.Review)
        .filter(models.Review.order_item_id == order_item.id)
        .first()
    )
    if existing_review:
        from backend.core.exceptions import ConflictError
        raise ConflictError("이미 리뷰를 작성하셨습니다.")

    import uuid
    review = models.Review(
        id=str(uuid.uuid4()),
        product_id=payload.product_id,
        user_id=user_id,
        order_item_id=order_item.id,
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


def can_user_review_product(
    db: Session,
    user_id: str,
    product_id: int,
) -> dict:
    """사용자가 해당 상품에 리뷰를 작성할 수 있는지 확인"""
    # 사용자가 해당 상품을 구매했는지 확인
    order_item = (
        db.query(models.OrderItem)
        .join(models.Order)
        .filter(
            models.Order.user_id == user_id,
            models.OrderItem.product_id == product_id,
            models.Order.status.in_(["completed", "delivered"]),
        )
        .order_by(models.OrderItem.created_at.desc())
        .first()
    )

    if not order_item:
        return {
            "can_review": False,
            "reason": "구매한 상품에만 리뷰를 작성할 수 있습니다.",
            "order_item_id": None,
        }

    # 이미 리뷰를 작성했는지 확인
    existing_review = (
        db.query(models.Review)
        .filter(models.Review.order_item_id == order_item.id)
        .first()
    )

    if existing_review:
        return {
            "can_review": False,
            "reason": "이미 리뷰를 작성하셨습니다.",
            "order_item_id": str(order_item.id),
        }

    return {
        "can_review": True,
        "reason": None,
        "order_item_id": str(order_item.id),
    }

