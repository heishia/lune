"""문의 서비스"""
from datetime import datetime
from typing import List, Optional, Tuple
from uuid import uuid4

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.core.exceptions import NotFoundError, BadRequestError
from backend.core.logger import get_logger

logger = get_logger(__name__)


# 문의 데이터 (실제 구현 시 DB 모델 사용)
# DB 스키마에 inquiries 테이블이 있으므로 모델 정의 필요


def create_inquiry(
    db: Session,
    user_id: str,
    inquiry_type: str,
    title: str,
    content: str,
    product_id: Optional[int] = None,
) -> dict:
    """문의 생성"""
    valid_types = ["product", "order", "delivery", "return", "general"]
    if inquiry_type not in valid_types:
        raise BadRequestError(f"유효하지 않은 문의 유형입니다. ({', '.join(valid_types)})")
    
    inquiry = {
        "id": str(uuid4()),
        "user_id": user_id,
        "product_id": product_id,
        "type": inquiry_type,
        "title": title,
        "content": content,
        "is_answered": False,
        "answer": None,
        "answered_at": None,
        "answered_by": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    # TODO: DB에 저장
    logger.info("Inquiry created: %s by user %s", title, user_id)
    
    return inquiry


def get_user_inquiries(
    db: Session,
    user_id: str,
    limit: int = 20,
    offset: int = 0,
) -> Tuple[List[dict], int]:
    """사용자 문의 목록 조회"""
    # TODO: 실제 DB 조회
    inquiries = []
    total = 0
    
    return inquiries, total


def get_inquiry(
    db: Session,
    inquiry_id: str,
    user_id: Optional[str] = None,
) -> dict:
    """문의 상세 조회"""
    # TODO: 실제 DB 조회
    raise NotFoundError("문의를 찾을 수 없습니다.")


def answer_inquiry(
    db: Session,
    inquiry_id: str,
    answer: str,
    admin_name: str,
) -> dict:
    """문의 답변 (관리자)"""
    # TODO: 실제 DB 업데이트
    inquiry = {
        "id": inquiry_id,
        "is_answered": True,
        "answer": answer,
        "answered_at": datetime.utcnow(),
        "answered_by": admin_name,
        "updated_at": datetime.utcnow(),
    }
    
    logger.info("Inquiry answered: %s by %s", inquiry_id, admin_name)
    
    return inquiry


def delete_inquiry(
    db: Session,
    inquiry_id: str,
    user_id: str,
) -> bool:
    """문의 삭제 (미답변 상태만 가능)"""
    # TODO: 실제 DB 삭제
    return True


def get_all_inquiries(
    db: Session,
    is_answered: Optional[bool] = None,
    inquiry_type: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> Tuple[List[dict], int]:
    """모든 문의 조회 (관리자)"""
    # TODO: 실제 DB 조회
    inquiries = []
    total = 0
    
    return inquiries, total

