"""주문 Repository"""
from typing import Optional, List, Tuple
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from backend.core.models import Order, OrderItem
from .base import BaseRepository


class OrderRepository(BaseRepository[Order]):
    """주문 데이터 접근 Repository"""
    
    def __init__(self, db: Session):
        super().__init__(Order, db)
    
    def get_by_order_number(self, order_number: str) -> Optional[Order]:
        """주문번호로 주문 조회"""
        return self.db.query(Order).filter(
            Order.order_number == order_number
        ).first()
    
    def get_by_user(
        self,
        user_id: str,
        *,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[Order], int]:
        """사용자별 주문 목록 조회"""
        query = self.db.query(Order).filter(Order.user_id == user_id)
        
        if status:
            query = query.filter(Order.status == status)
        
        total = query.with_entities(func.count(Order.id)).scalar() or 0
        orders = query.options(
            joinedload(Order.items)
        ).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
        
        return orders, total
    
    def get_with_items(self, order_id: str) -> Optional[Order]:
        """주문 상세 조회 (아이템 포함, N+1 방지)"""
        return self.db.query(Order).options(
            joinedload(Order.items).joinedload(OrderItem.product)
        ).filter(Order.id == order_id).first()
    
    def get_by_user_and_id(self, user_id: str, order_id: str) -> Optional[Order]:
        """사용자 ID와 주문 ID로 주문 조회"""
        return self.db.query(Order).filter(
            Order.id == order_id,
            Order.user_id == user_id
        ).first()
    
    def get_pending_orders(self) -> List[Order]:
        """결제 대기 중인 주문 목록"""
        return self.db.query(Order).filter(
            Order.status == "pending"
        ).order_by(Order.created_at.asc()).all()
    
    def get_by_status(
        self,
        status: str,
        *,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Order]:
        """상태별 주문 조회"""
        return self.db.query(Order).filter(
            Order.status == status
        ).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    
    def update_status(
        self,
        order_id: str,
        new_status: str,
        **extra_fields
    ) -> Optional[Order]:
        """주문 상태 업데이트"""
        order = self.get_by_id(order_id)
        if not order:
            return None
        
        order.status = new_status
        order.updated_at = datetime.utcnow()
        
        for field, value in extra_fields.items():
            if hasattr(order, field):
                setattr(order, field, value)
        
        self.db.commit()
        self.db.refresh(order)
        return order
    
    def update_payment_status(
        self,
        order_id: str,
        payment_status: str,
        payment_key: Optional[str] = None,
    ) -> Optional[Order]:
        """결제 상태 업데이트"""
        order = self.get_by_id(order_id)
        if not order:
            return None
        
        order.payment_status = payment_status
        order.updated_at = datetime.utcnow()
        
        if payment_key:
            order.payment_key = payment_key
        
        if payment_status == "paid":
            order.status = "paid"
            order.paid_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(order)
        return order
    
    def cancel_order(
        self,
        order_id: str,
        reason: str,
    ) -> Optional[Order]:
        """주문 취소"""
        return self.update_status(
            order_id,
            "cancelled",
            cancel_reason=reason,
            cancelled_at=datetime.utcnow(),
        )
    
    def get_all_orders(
        self,
        *,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[Order], int]:
        """모든 주문 조회 (관리자용)"""
        query = self.db.query(Order)
        
        if status:
            query = query.filter(Order.status == status)
        
        total = query.with_entities(func.count(Order.id)).scalar() or 0
        orders = query.options(
            joinedload(Order.items),
            joinedload(Order.user)
        ).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
        
        return orders, total
    
    def get_daily_stats(self, date: datetime) -> dict:
        """일별 주문 통계"""
        start = datetime(date.year, date.month, date.day)
        end = datetime(date.year, date.month, date.day, 23, 59, 59)
        
        orders = self.db.query(Order).filter(
            Order.created_at >= start,
            Order.created_at <= end,
            Order.status.notin_(["cancelled", "refunded"])
        ).all()
        
        return {
            "date": date.strftime("%Y-%m-%d"),
            "order_count": len(orders),
            "total_revenue": sum(o.final_amount for o in orders),
            "average_order_value": sum(o.final_amount for o in orders) / len(orders) if orders else 0,
        }

