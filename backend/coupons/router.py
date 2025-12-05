from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import get_admin_user_id, get_current_user_id

from . import schemas, service

router = APIRouter(prefix="/coupons", tags=["coupons"])


@router.get("", response_model=schemas.CouponsListResponse)
def get_coupons(
    admin_id: str = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
) -> schemas.CouponsListResponse:
    """쿠폰 목록 조회 (관리자 전용)"""
    coupons, total = service.list_coupons(db=db)
    return schemas.CouponsListResponse(
        coupons=[
            schemas.CouponResponse(
                id=str(c.id),
                code=c.code,
                name=c.name,
                description=c.description,
                discount_type=c.discount_type,
                discount_value=c.discount_value,
                min_purchase_amount=c.min_purchase_amount,
                max_discount_amount=c.max_discount_amount,
                valid_from=c.valid_from,
                valid_until=c.valid_until,
                usage_limit=c.usage_limit,
                usage_count=c.usage_count,
                is_active=c.is_active,
                created_at=c.created_at,
            )
            for c in coupons
        ],
        total=total,
    )


@router.post("", response_model=schemas.CouponResponse)
def create_coupon(
    payload: schemas.CreateCouponRequest,
    admin_id: str = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
) -> schemas.CouponResponse:
    """쿠폰 생성 (관리자 전용)"""
    coupon = service.create_coupon(db=db, payload=payload)
    return schemas.CouponResponse(
        id=str(coupon.id),
        code=coupon.code,
        name=coupon.name,
        description=coupon.description,
        discount_type=coupon.discount_type,
        discount_value=coupon.discount_value,
        min_purchase_amount=coupon.min_purchase_amount,
        max_discount_amount=coupon.max_discount_amount,
        valid_from=coupon.valid_from,
        valid_until=coupon.valid_until,
        usage_limit=coupon.usage_limit,
        usage_count=coupon.usage_count,
        is_active=coupon.is_active,
        created_at=coupon.created_at,
    )


@router.put("/{coupon_id}", response_model=schemas.CouponResponse)
def update_coupon(
    coupon_id: str,
    payload: schemas.UpdateCouponRequest,
    admin_id: str = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
) -> schemas.CouponResponse:
    """쿠폰 수정 (관리자 전용)"""
    coupon = service.update_coupon(db=db, coupon_id=coupon_id, payload=payload)
    return schemas.CouponResponse(
        id=str(coupon.id),
        code=coupon.code,
        name=coupon.name,
        description=coupon.description,
        discount_type=coupon.discount_type,
        discount_value=coupon.discount_value,
        min_purchase_amount=coupon.min_purchase_amount,
        max_discount_amount=coupon.max_discount_amount,
        valid_from=coupon.valid_from,
        valid_until=coupon.valid_until,
        usage_limit=coupon.usage_limit,
        usage_count=coupon.usage_count,
        is_active=coupon.is_active,
        created_at=coupon.created_at,
    )


@router.delete("/{coupon_id}")
def delete_coupon(
    coupon_id: str,
    admin_id: str = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
) -> dict:
    """쿠폰 삭제 (관리자 전용)"""
    service.delete_coupon(db=db, coupon_id=coupon_id)
    return {"success": True}


@router.post("/{coupon_id}/issue/{user_id}")
def issue_coupon(
    coupon_id: str,
    user_id: str,
    admin_id: str = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
) -> dict:
    """사용자에게 쿠폰 발행 (관리자 전용)"""
    service.issue_coupon_to_user(db=db, coupon_id=coupon_id, user_id=user_id)
    return {"success": True, "message": "쿠폰이 발행되었습니다."}


@router.get("/my", response_model=schemas.UserCouponsListResponse)
def get_my_coupons(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> schemas.UserCouponsListResponse:
    """내 쿠폰 목록 조회"""
    user_coupons, total = service.get_user_coupons(db=db, user_id=user_id)
    return schemas.UserCouponsListResponse(
        coupons=[
            schemas.UserCouponResponse(
                id=str(uc.id),
                coupon_id=str(uc.coupon_id),
                coupon_name=uc.coupon.name,
                coupon_code=uc.coupon.code,
                discount_type=uc.coupon.discount_type,
                discount_value=uc.coupon.discount_value,
                valid_until=uc.coupon.valid_until,
                is_used=uc.is_used,
                used_at=uc.used_at,
                created_at=uc.created_at,
            )
            for uc in user_coupons
        ],
        total=total,
    )

