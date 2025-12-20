"""알림 스키마"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class NotificationCreate(BaseModel):
    """알림 생성 요청"""
    type: str  # order, review, promotion, system
    title: str
    message: str
    link: Optional[str] = None


class NotificationResponse(BaseModel):
    """알림 응답"""
    id: str
    type: str
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime


class NotificationListResponse(BaseModel):
    """알림 목록 응답"""
    notifications: List[NotificationResponse]
    total: int
    unread_count: int


class NotificationReadResponse(BaseModel):
    """알림 읽음 응답"""
    success: bool
    message: str

