from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import get_admin_user_id

from . import schemas, service

router = APIRouter(prefix="/admin", tags=["admin"])


# ==========================================
# 주문 관리 API
# ==========================================

@router.get("/orders", response_model=schemas.AdminOrdersListResponse)
def get_all_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(default=None),
    admin_id: str = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
) -> schemas.AdminOrdersListResponse:
    """모든 주문 목록 조회 (관리자 전용)"""
    orders, total, total_pages = service.list_all_orders(
        db=db, page=page, limit=limit, status_filter=status
    )
    
    result_orders = []
    for order in orders:
        # 사용자 정보 조회
        user = None
        if order.user_id:
            user = db.query(service.models.User).filter(
                service.models.User.id == order.user_id
            ).first()
        
        result_orders.append(
            schemas.AdminOrderResponse(
                id=str(order.id),
                order_number=order.order_number,
                user_id=str(order.user_id) if order.user_id else None,
                user_name=user.name if user else None,
                user_email=user.email if user else None,
                status=order.status,
                total_amount=order.total_amount,
                discount_amount=order.discount_amount,
                shipping_fee=order.shipping_fee,
                final_amount=order.final_amount,
                recipient_name=order.recipient_name,
                recipient_phone=order.recipient_phone,
                postal_code=order.postal_code,
                address=order.address,
                address_detail=order.address_detail,
                delivery_message=order.delivery_message,
                payment_method=order.payment_method,
                payment_status=order.payment_status,
                tracking_number=order.tracking_number,
                courier=order.courier,
                created_at=order.created_at,
                items=[
                    schemas.AdminOrderItem(
                        id=str(item.id),
                        product_name=item.product_name,
                        product_image=item.product_image,
                        quantity=item.quantity,
                        color=item.color,
                        size=item.size,
                        price=item.price,
                    )
                    for item in order.items
                ],
            )
        )
    
    return schemas.AdminOrdersListResponse(
        orders=result_orders,
        total=total,
        page=page,
        total_pages=total_pages,
    )


@router.get("/orders/{order_id}", response_model=schemas.AdminOrderResponse)
def get_order_detail(
    order_id: str,
    admin_id: str = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
) -> schemas.AdminOrderResponse:
    """주문 상세 조회 (관리자 전용)"""
    order = service.get_order_detail(db=db, order_id=order_id)
    
    user = None
    if order.user_id:
        user = db.query(service.models.User).filter(
            service.models.User.id == order.user_id
        ).first()
    
    return schemas.AdminOrderResponse(
        id=str(order.id),
        order_number=order.order_number,
        user_id=str(order.user_id) if order.user_id else None,
        user_name=user.name if user else None,
        user_email=user.email if user else None,
        status=order.status,
        total_amount=order.total_amount,
        discount_amount=order.discount_amount,
        shipping_fee=order.shipping_fee,
        final_amount=order.final_amount,
        recipient_name=order.recipient_name,
        recipient_phone=order.recipient_phone,
        postal_code=order.postal_code,
        address=order.address,
        address_detail=order.address_detail,
        delivery_message=order.delivery_message,
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        tracking_number=order.tracking_number,
        courier=order.courier,
        created_at=order.created_at,
        items=[
            schemas.AdminOrderItem(
                id=str(item.id),
                product_name=item.product_name,
                product_image=item.product_image,
                quantity=item.quantity,
                color=item.color,
                size=item.size,
                price=item.price,
            )
            for item in order.items
        ],
    )


@router.put("/orders/{order_id}/status", response_model=schemas.AdminOrderResponse)
def update_order_status(
    order_id: str,
    payload: schemas.UpdateOrderStatusRequest,
    admin_id: str = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
) -> schemas.AdminOrderResponse:
    """주문 상태 변경 (관리자 전용)"""
    order = service.update_order_status(db=db, order_id=order_id, payload=payload)
    
    user = None
    if order.user_id:
        user = db.query(service.models.User).filter(
            service.models.User.id == order.user_id
        ).first()
    
    return schemas.AdminOrderResponse(
        id=str(order.id),
        order_number=order.order_number,
        user_id=str(order.user_id) if order.user_id else None,
        user_name=user.name if user else None,
        user_email=user.email if user else None,
        status=order.status,
        total_amount=order.total_amount,
        discount_amount=order.discount_amount,
        shipping_fee=order.shipping_fee,
        final_amount=order.final_amount,
        recipient_name=order.recipient_name,
        recipient_phone=order.recipient_phone,
        postal_code=order.postal_code,
        address=order.address,
        address_detail=order.address_detail,
        delivery_message=order.delivery_message,
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        tracking_number=order.tracking_number,
        courier=order.courier,
        created_at=order.created_at,
        items=[
            schemas.AdminOrderItem(
                id=str(item.id),
                product_name=item.product_name,
                product_image=item.product_image,
                quantity=item.quantity,
                color=item.color,
                size=item.size,
                price=item.price,
            )
            for item in order.items
        ],
    )


# ==========================================
# 사용자 검색 API
# ==========================================

@router.get("/users", response_model=schemas.UsersSearchListResponse)
def search_users(
    query: str = Query("", description="검색어 (이름, 이메일, 전화번호)"),
    admin_id: str = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
) -> schemas.UsersSearchListResponse:
    """사용자 검색 (관리자 전용)"""
    users, total = service.search_users(db=db, query=query)
    return schemas.UsersSearchListResponse(
        users=[
            schemas.UserSearchResponse(
                id=str(u.id),
                email=u.email,
                name=u.name,
                phone=u.phone,
                points=u.points,
                is_active=u.is_active,
                marketing_agreed=u.marketing_agreed,
                created_at=u.created_at,
            )
            for u in users
        ],
        total=total,
    )


@router.get("/users/{user_id}", response_model=schemas.UserSearchResponse)
def get_user(
    user_id: str,
    admin_id: str = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
) -> schemas.UserSearchResponse:
    """사용자 상세 조회 (관리자 전용)"""
    user = service.get_user_by_id(db=db, user_id=user_id)
    return schemas.UserSearchResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        phone=user.phone,
        points=user.points,
        is_active=user.is_active,
        marketing_agreed=user.marketing_agreed,
        created_at=user.created_at,
    )


# ==========================================
# 포인트 관리 API
# ==========================================

@router.post("/users/{user_id}/points", response_model=schemas.PointHistoryResponse)
def issue_points(
    user_id: str,
    payload: schemas.IssuePointsRequest,
    admin_id: str = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
) -> schemas.PointHistoryResponse:
    """사용자에게 포인트 지급 (관리자 전용)"""
    point_record = service.issue_points(
        db=db,
        user_id=user_id,
        points=payload.points,
        reason=payload.reason,
    )
    return schemas.PointHistoryResponse(
        id=str(point_record.id),
        user_id=str(point_record.user_id),
        points=point_record.points,
        reason=point_record.reason,
        created_at=point_record.created_at,
    )


@router.get("/points/history", response_model=schemas.PointHistoryListResponse)
def get_point_history(
    user_id: Optional[str] = Query(default=None, description="사용자 ID (없으면 전체)"),
    admin_id: str = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
) -> schemas.PointHistoryListResponse:
    """포인트 내역 조회 (관리자 전용)"""
    history, total = service.get_point_history(db=db, user_id=user_id)
    return schemas.PointHistoryListResponse(
        history=[
            schemas.PointHistoryResponse(
                id=str(h.id),
                user_id=str(h.user_id),
                points=h.points,
                reason=h.reason,
                created_at=h.created_at,
            )
            for h in history
        ],
        total=total,
    )

