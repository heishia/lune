from __future__ import annotations

from datetime import datetime
from typing import List, Tuple
from uuid import uuid4

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.core import models
from backend.core.exceptions import NotFoundError, BadRequestError

from . import schemas


def list_coupons(db: Session) -> Tuple[List[models.Coupon], int]:
    """쿠폰 목록 조회"""
    query = db.query(models.Coupon).order_by(models.Coupon.created_at.desc())
    total = query.with_entities(func.count(models.Coupon.id)).scalar() or 0
    coupons = query.all()
    return coupons, total


def get_coupon(db: Session, coupon_id: str) -> models.Coupon:
    """쿠폰 상세 조회"""
    coupon = db.query(models.Coupon).filter(models.Coupon.id == coupon_id).first()
    if not coupon:
        raise NotFoundError("쿠폰을 찾을 수 없습니다.")
    return coupon


def create_coupon(db: Session, payload: schemas.CreateCouponRequest) -> models.Coupon:
    """쿠폰 생성"""
    # 쿠폰 코드 중복 확인
    existing = db.query(models.Coupon).filter(models.Coupon.code == payload.code).first()
    if existing:
        raise BadRequestError("이미 존재하는 쿠폰 코드입니다.")
    
    coupon = models.Coupon(
        id=str(uuid4()),
        code=payload.code,
        name=payload.name,
        description=payload.description,
        discount_type=payload.discount_type,
        discount_value=payload.discount_value,
        min_purchase_amount=payload.min_purchase_amount,
        max_discount_amount=payload.max_discount_amount,
        valid_from=payload.valid_from,
        valid_until=payload.valid_until,
        usage_limit=payload.usage_limit,
        usage_count=0,
        is_active=payload.is_active,
        created_at=datetime.utcnow(),
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon


def update_coupon(
    db: Session,
    coupon_id: str,
    payload: schemas.UpdateCouponRequest,
) -> models.Coupon:
    """쿠폰 수정"""
    coupon = get_coupon(db, coupon_id)
    
    if payload.name is not None:
        coupon.name = payload.name
    if payload.description is not None:
        coupon.description = payload.description
    if payload.discount_type is not None:
        coupon.discount_type = payload.discount_type
    if payload.discount_value is not None:
        coupon.discount_value = payload.discount_value
    if payload.min_purchase_amount is not None:
        coupon.min_purchase_amount = payload.min_purchase_amount
    if payload.max_discount_amount is not None:
        coupon.max_discount_amount = payload.max_discount_amount
    if payload.valid_from is not None:
        coupon.valid_from = payload.valid_from
    if payload.valid_until is not None:
        coupon.valid_until = payload.valid_until
    if payload.usage_limit is not None:
        coupon.usage_limit = payload.usage_limit
    if payload.is_active is not None:
        coupon.is_active = payload.is_active
    
    db.commit()
    db.refresh(coupon)
    return coupon


def delete_coupon(db: Session, coupon_id: str) -> None:
    """쿠폰 삭제"""
    coupon = get_coupon(db, coupon_id)
    db.delete(coupon)
    db.commit()


def issue_coupon_to_user(db: Session, coupon_id: str, user_id: str) -> models.UserCoupon:
    """사용자에게 쿠폰 발행"""
    coupon = get_coupon(db, coupon_id)
    
    # 쿠폰 유효성 확인
    if not coupon.is_active:
        raise BadRequestError("비활성화된 쿠폰입니다.")
    
    now = datetime.utcnow()
    if now < coupon.valid_from or now > coupon.valid_until:
        raise BadRequestError("유효하지 않은 쿠폰 기간입니다.")
    
    # 사용자 확인
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise NotFoundError("사용자를 찾을 수 없습니다.")
    
    # 이미 발급받았는지 확인
    existing = db.query(models.UserCoupon).filter(
        models.UserCoupon.user_id == user_id,
        models.UserCoupon.coupon_id == coupon_id,
    ).first()
    if existing:
        raise BadRequestError("이미 발급받은 쿠폰입니다.")
    
    # 사용자 쿠폰 발행
    user_coupon = models.UserCoupon(
        id=str(uuid4()),
        user_id=user_id,
        coupon_id=coupon_id,
        is_used=False,
        created_at=datetime.utcnow(),
    )
    db.add(user_coupon)
    db.commit()
    db.refresh(user_coupon)
    return user_coupon


def get_user_coupons(db: Session, user_id: str) -> Tuple[List[models.UserCoupon], int]:
    """사용자 보유 쿠폰 조회"""
    query = (
        db.query(models.UserCoupon)
        .filter(models.UserCoupon.user_id == user_id)
        .order_by(models.UserCoupon.created_at.desc())
    )
    total = query.with_entities(func.count(models.UserCoupon.id)).scalar() or 0
    user_coupons = query.all()
    return user_coupons, total

