"""알림 라우터"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import get_current_user_id

from . import schemas, service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=schemas.NotificationListResponse)
def get_my_notifications(
    limit: int = 20,
    offset: int = 0,
    unread_only: bool = False,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> schemas.NotificationListResponse:
    """내 알림 목록 조회"""
    notifications, total, unread_count = service.get_user_notifications(
        db=db,
        user_id=user_id,
        limit=limit,
        offset=offset,
        unread_only=unread_only,
    )
    
    return schemas.NotificationListResponse(
        notifications=[
            schemas.NotificationResponse(
                id=n["id"],
                type=n["type"],
                title=n["title"],
                message=n["message"],
                link=n.get("link"),
                is_read=n["is_read"],
                created_at=n["created_at"],
            )
            for n in notifications
        ],
        total=total,
        unread_count=unread_count,
    )


@router.post("/{notification_id}/read", response_model=schemas.NotificationReadResponse)
def mark_notification_as_read(
    notification_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> schemas.NotificationReadResponse:
    """알림 읽음 처리"""
    success = service.mark_as_read(
        db=db,
        user_id=user_id,
        notification_id=notification_id,
    )
    
    return schemas.NotificationReadResponse(
        success=success,
        message="알림을 읽음 처리했습니다." if success else "알림을 찾을 수 없습니다.",
    )


@router.post("/read-all", response_model=schemas.NotificationReadResponse)
def mark_all_notifications_as_read(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> schemas.NotificationReadResponse:
    """모든 알림 읽음 처리"""
    count = service.mark_all_as_read(db=db, user_id=user_id)
    
    return schemas.NotificationReadResponse(
        success=True,
        message=f"{count}개의 알림을 읽음 처리했습니다.",
    )


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    """알림 삭제"""
    success = service.delete_notification(
        db=db,
        user_id=user_id,
        notification_id=notification_id,
    )
    
    return {
        "success": success,
        "message": "알림이 삭제되었습니다." if success else "알림을 찾을 수 없습니다.",
    }

