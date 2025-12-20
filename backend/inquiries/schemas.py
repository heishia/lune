"""문의 스키마"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class InquiryCreate(BaseModel):
    """문의 생성 요청"""
    product_id: Optional[int] = None  # 상품 문의인 경우
    type: str  # product, order, delivery, return, general
    title: str
    content: str


class InquiryResponse(BaseModel):
    """문의 응답"""
    id: str
    product_id: Optional[int] = None
    type: str
    title: str
    content: str
    is_answered: bool
    answer: Optional[str] = None
    answered_at: Optional[datetime] = None
    answered_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class InquiryListResponse(BaseModel):
    """문의 목록 응답"""
    inquiries: List[InquiryResponse]
    total: int


class InquiryAnswerRequest(BaseModel):
    """문의 답변 요청 (관리자)"""
    answer: str


class InquiryAnswerResponse(BaseModel):
    """문의 답변 응답"""
    success: bool
    message: str

