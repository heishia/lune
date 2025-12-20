"""알림 서비스"""
from datetime import datetime
from typing import List, Tuple
from uuid import uuid4

from sqlalchemy import func, and_
from sqlalchemy.orm import Session

from backend.core.logger import get_logger

logger = get_logger(__name__)


# Notification 모델이 없으므로 임시로 딕셔너리 기반 구현
# 실제 구현 시 models.Notification 사용

def get_user_notifications(
    db: Session,
    user_id: str,
    limit: int = 20,
    offset: int = 0,
    unread_only: bool = False,
) -> Tuple[List[dict], int, int]:
    """사용자 알림 목록 조회
    
    Returns:
        (알림 목록, 전체 수, 읽지 않은 수)
    """
    # TODO: 실제 Notification 모델 사용
    # 임시 구현
    notifications = []
    total = 0
    unread_count = 0
    
    return notifications, total, unread_count


def create_notification(
    db: Session,
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    link: str = None,
) -> dict:
    """알림 생성"""
    notification = {
        "id": str(uuid4()),
        "user_id": user_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "link": link,
        "is_read": False,
        "created_at": datetime.utcnow(),
    }
    
    # TODO: DB에 저장
    logger.info("Notification created: %s for user %s", title, user_id)
    
    return notification


def mark_as_read(
    db: Session,
    user_id: str,
    notification_id: str,
) -> bool:
    """알림 읽음 처리"""
    # TODO: 실제 DB 업데이트
    return True


def mark_all_as_read(
    db: Session,
    user_id: str,
) -> int:
    """모든 알림 읽음 처리
    
    Returns:
        업데이트된 알림 수
    """
    # TODO: 실제 DB 업데이트
    return 0


def delete_notification(
    db: Session,
    user_id: str,
    notification_id: str,
) -> bool:
    """알림 삭제"""
    # TODO: 실제 DB 삭제
    return True


# 알림 헬퍼 함수들

def notify_order_status_changed(
    db: Session,
    user_id: str,
    order_number: str,
    new_status: str,
) -> dict:
    """주문 상태 변경 알림"""
    status_messages = {
        "paid": "결제가 완료되었습니다",
        "preparing": "상품 준비 중입니다",
        "shipped": "상품이 발송되었습니다",
        "delivered": "배송이 완료되었습니다",
        "cancelled": "주문이 취소되었습니다",
    }
    
    message = status_messages.get(new_status, f"주문 상태가 {new_status}(으)로 변경되었습니다")
    
    return create_notification(
        db=db,
        user_id=user_id,
        notification_type="order",
        title=f"주문 상태 변경 ({order_number})",
        message=message,
        link=f"/orders/{order_number}",
    )


def notify_product_back_in_stock(
    db: Session,
    user_id: str,
    product_id: int,
    product_name: str,
) -> dict:
    """찜한 상품 재입고 알림"""
    return create_notification(
        db=db,
        user_id=user_id,
        notification_type="promotion",
        title="찜한 상품 재입고",
        message=f"'{product_name}' 상품이 재입고되었습니다!",
        link=f"/products/{product_id}",
    )


def notify_coupon_expiring(
    db: Session,
    user_id: str,
    coupon_name: str,
    days_left: int,
) -> dict:
    """쿠폰 만료 임박 알림"""
    return create_notification(
        db=db,
        user_id=user_id,
        notification_type="promotion",
        title="쿠폰 만료 임박",
        message=f"'{coupon_name}' 쿠폰이 {days_left}일 후 만료됩니다!",
        link="/coupons",
    )

