"""감사 로그 모듈

중요 작업에 대한 감사 로그를 기록합니다.
"""
from datetime import datetime
from typing import Any, Optional
from uuid import uuid4

from sqlalchemy.orm import Session

from .logger import get_logger

logger = get_logger(__name__)


class AuditAction:
    """감사 로그 액션 유형"""
    # 인증 관련
    LOGIN = "login"
    LOGOUT = "logout"
    LOGIN_FAILED = "login_failed"
    PASSWORD_CHANGED = "password_changed"
    PASSWORD_RESET = "password_reset"
    
    # 사용자 관련
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    
    # 주문 관련
    ORDER_CREATED = "order_created"
    ORDER_UPDATED = "order_updated"
    ORDER_CANCELLED = "order_cancelled"
    PAYMENT_COMPLETED = "payment_completed"
    REFUND_PROCESSED = "refund_processed"
    
    # 상품 관련
    PRODUCT_CREATED = "product_created"
    PRODUCT_UPDATED = "product_updated"
    PRODUCT_DELETED = "product_deleted"
    
    # 관리자 관련
    ADMIN_ACTION = "admin_action"
    SETTINGS_CHANGED = "settings_changed"


class AuditLog:
    """감사 로그 엔트리"""
    
    def __init__(
        self,
        action: str,
        user_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ):
        self.id = str(uuid4())
        self.action = action
        self.user_id = user_id
        self.resource_type = resource_type
        self.resource_id = resource_id
        self.details = details or {}
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.created_at = datetime.utcnow()
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "action": self.action,
            "user_id": self.user_id,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "details": self.details,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "created_at": self.created_at.isoformat(),
        }


def log_audit(
    db: Session,
    action: str,
    user_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> AuditLog:
    """감사 로그 기록
    
    Args:
        db: 데이터베이스 세션
        action: 수행된 액션
        user_id: 수행한 사용자 ID
        resource_type: 대상 리소스 유형 (user, order, product 등)
        resource_id: 대상 리소스 ID
        details: 추가 상세 정보
        ip_address: 클라이언트 IP
        user_agent: 클라이언트 User-Agent
    
    Returns:
        생성된 AuditLog 객체
    """
    audit_log = AuditLog(
        action=action,
        user_id=user_id,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    
    # 로그 출력
    logger.info(
        "AUDIT: %s | user=%s | %s:%s | ip=%s",
        action,
        user_id or "anonymous",
        resource_type or "-",
        resource_id or "-",
        ip_address or "-",
    )
    
    # TODO: DB에 저장 (audit_logs 테이블 필요)
    # db.add(audit_log_model)
    # db.commit()
    
    return audit_log


def log_login(
    db: Session,
    user_id: str,
    success: bool,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    failure_reason: Optional[str] = None,
) -> AuditLog:
    """로그인 감사 로그"""
    action = AuditAction.LOGIN if success else AuditAction.LOGIN_FAILED
    details = {"success": success}
    
    if failure_reason:
        details["reason"] = failure_reason
    
    return log_audit(
        db=db,
        action=action,
        user_id=user_id,
        resource_type="user",
        resource_id=user_id,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
    )


def log_order_action(
    db: Session,
    action: str,
    order_id: str,
    user_id: str,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """주문 관련 감사 로그"""
    return log_audit(
        db=db,
        action=action,
        user_id=user_id,
        resource_type="order",
        resource_id=order_id,
        details=details,
        ip_address=ip_address,
    )


def log_admin_action(
    db: Session,
    admin_id: str,
    action_description: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """관리자 작업 감사 로그"""
    return log_audit(
        db=db,
        action=AuditAction.ADMIN_ACTION,
        user_id=admin_id,
        resource_type=resource_type,
        resource_id=resource_id,
        details={
            "description": action_description,
            **(details or {}),
        },
        ip_address=ip_address,
    )

