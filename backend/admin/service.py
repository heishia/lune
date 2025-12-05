from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Tuple
from uuid import uuid4

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from backend.core import models
from backend.core.exceptions import NotFoundError, BadRequestError

from . import schemas


# 주문 관리 관련 서비스
def list_all_orders(
    db: Session,
    page: int = 1,
    limit: int = 20,
    status_filter: Optional[str] = None,
) -> Tuple[List[models.Order], int, int]:
    """모든 주문 목록 조회 (관리자용)"""
    query = db.query(models.Order).options(joinedload(models.Order.items))
    
    if status_filter:
        query = query.filter(models.Order.status == status_filter)
    
    total = db.query(func.count(models.Order.id)).scalar() or 0
    if status_filter:
        total = query.with_entities(func.count(models.Order.id)).scalar() or 0
    
    page = max(page, 1)
    limit = max(min(limit, 100), 1)
    offset = (page - 1) * limit
    
    orders = (
        query.order_by(models.Order.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return orders, total, total_pages


def get_order_detail(db: Session, order_id: str) -> models.Order:
    """주문 상세 조회 (관리자용)"""
    order = (
        db.query(models.Order)
        .options(joinedload(models.Order.items))
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise NotFoundError("주문을 찾을 수 없습니다.")
    return order


def update_order_status(
    db: Session,
    order_id: str,
    payload: schemas.UpdateOrderStatusRequest,
) -> models.Order:
    """주문 상태 변경 (관리자용)"""
    order = get_order_detail(db, order_id)
    
    valid_statuses = ["pending", "paid", "preparing", "shipped", "delivered", "cancelled", "refunded"]
    if payload.status not in valid_statuses:
        raise BadRequestError(f"유효하지 않은 상태입니다. 가능한 상태: {', '.join(valid_statuses)}")
    
    order.status = payload.status
    order.updated_at = datetime.utcnow()
    
    # 배송중일 경우 송장 정보 업데이트
    if payload.status == "shipped":
        if payload.tracking_number:
            order.tracking_number = payload.tracking_number
        if payload.courier:
            order.courier = payload.courier
        order.shipped_at = datetime.utcnow()
    
    # 배송완료일 경우
    if payload.status == "delivered":
        order.delivered_at = datetime.utcnow()
    
    # 취소일 경우
    if payload.status == "cancelled":
        order.cancelled_at = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    return order


# 사용자 검색 관련 서비스
def search_users(
    db: Session,
    query: str,
) -> Tuple[List[models.User], int]:
    """사용자 검색"""
    search_query = db.query(models.User)
    
    if query:
        search_pattern = f"%{query}%"
        search_query = search_query.filter(
            or_(
                models.User.name.ilike(search_pattern),
                models.User.email.ilike(search_pattern),
                models.User.phone.ilike(search_pattern),
            )
        )
    
    total = search_query.with_entities(func.count(models.User.id)).scalar() or 0
    users = search_query.order_by(models.User.created_at.desc()).limit(50).all()
    
    return users, total


def get_user_by_id(db: Session, user_id: str) -> models.User:
    """사용자 조회"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise NotFoundError("사용자를 찾을 수 없습니다.")
    return user


# 포인트 관련 서비스
def issue_points(
    db: Session,
    user_id: str,
    points: int,
    reason: str,
) -> models.UserPoints:
    """포인트 지급"""
    user = get_user_by_id(db, user_id)
    
    point_record = models.UserPoints(
        id=str(uuid4()),
        user_id=user_id,
        points=points,
        reason=reason,
        created_at=datetime.utcnow(),
    )
    db.add(point_record)
    
    # 사용자 포인트 업데이트 (DB 트리거로도 처리되지만 명시적으로)
    user.points = user.points + points
    
    db.commit()
    db.refresh(point_record)
    return point_record


def get_point_history(
    db: Session,
    user_id: Optional[str] = None,
) -> Tuple[List[models.UserPoints], int]:
    """포인트 내역 조회"""
    query = db.query(models.UserPoints)
    
    if user_id:
        query = query.filter(models.UserPoints.user_id == user_id)
    
    query = query.order_by(models.UserPoints.created_at.desc())
    total = query.with_entities(func.count(models.UserPoints.id)).scalar() or 0
    history = query.limit(100).all()
    
    return history, total

