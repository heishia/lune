from typing import Optional
import httpx
from sqlalchemy.orm import Session

from backend.core import models

# Instagram 설정의 고정 ID
INSTAGRAM_SETTINGS_ID = "00000000-0000-0000-0000-000000000001"


def get_instagram_settings(db: Session) -> models.InstagramSettings:
    """Instagram 설정을 조회합니다. 없으면 생성합니다."""
    settings = db.query(models.InstagramSettings).filter(
        models.InstagramSettings.id == INSTAGRAM_SETTINGS_ID
    ).first()
    
    if not settings:
        from datetime import datetime
        settings = models.InstagramSettings(
            id=INSTAGRAM_SETTINGS_ID,
            access_token="",
            featured_image_url=None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return settings


def update_instagram_settings(
    db: Session,
    access_token: Optional[str] = None,
    featured_image_url: Optional[str] = None,
) -> models.InstagramSettings:
    """Instagram 액세스 토큰과 대표 이미지 URL을 업데이트합니다."""
    settings = get_instagram_settings(db)
    if access_token is not None:
        settings.access_token = access_token
    if featured_image_url is not None:
        settings.featured_image_url = featured_image_url
    db.commit()
    db.refresh(settings)
    return settings


async def get_instagram_media(access_token: str) -> list[dict]:
    """
    Instagram Basic Display API를 사용하여 미디어 목록을 조회합니다.
    
    Returns:
        미디어 목록 (각 미디어는 id, media_type, media_url, caption, permalink 등을 포함)
    """
    if not access_token:
        return []
    
    api_url = "https://graph.instagram.com/me/media"
    
    params = {
        "fields": "id,media_type,media_url,caption,permalink,timestamp",
        "access_token": access_token,
        "limit": 5,
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(api_url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                return data.get("data", [])
            else:
                # API 오류 시 빈 리스트 반환
                return []
    except Exception:
        # 예외 발생 시 빈 리스트 반환
        return []

