from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core.database import get_db

from . import schemas, service

router = APIRouter(prefix="/instagram", tags=["instagram"])


@router.get("/settings", response_model=schemas.InstagramSettingsResponse)
def get_settings(db: Session = Depends(get_db)) -> schemas.InstagramSettingsResponse:
    """Instagram 설정을 조회합니다."""
    instagram_settings = service.get_instagram_settings(db)
    has_token = bool(instagram_settings.access_token)
    
    return schemas.InstagramSettingsResponse(
        access_token=instagram_settings.access_token if instagram_settings.access_token else "",
        has_token=has_token,
        featured_image_url=instagram_settings.featured_image_url,
    )


@router.post("/settings", response_model=schemas.InstagramSettingsResponse)
def update_settings(
    payload: schemas.InstagramSettingsUpdate,
    db: Session = Depends(get_db),
) -> schemas.InstagramSettingsResponse:
    """Instagram 액세스 토큰과 대표 이미지 URL을 업데이트합니다."""
    # imageUrl이 있으면 featuredImageUrl로 변환
    featured_image_url = payload.featuredImageUrl or payload.imageUrl
    
    # accessToken이 없으면 기존 토큰 유지
    if payload.accessToken:
        settings = service.update_instagram_settings(
            db,
            payload.accessToken,
            featured_image_url,
        )
    else:
        # 토큰은 업데이트하지 않고 featured_image_url만 업데이트
        settings = service.get_instagram_settings(db)
        if featured_image_url is not None:
            settings.featured_image_url = featured_image_url
            db.commit()
            db.refresh(settings)
    
    return schemas.InstagramSettingsResponse(
        access_token=settings.access_token,
        has_token=bool(settings.access_token),
        featured_image_url=settings.featured_image_url,
    )


@router.post("/featured-image", response_model=schemas.InstagramSettingsResponse)
def update_featured_image(
    payload: dict,
    db: Session = Depends(get_db),
) -> schemas.InstagramSettingsResponse:
    """Instagram 대표 이미지 URL을 업데이트합니다."""
    settings = service.get_instagram_settings(db)
    
    # 프론트엔드에서 imageUrl로 보내는 경우 처리
    featured_image_url = payload.get("featuredImageUrl") or payload.get("imageUrl")
    
    if featured_image_url is not None:
        settings.featured_image_url = featured_image_url
        db.commit()
        db.refresh(settings)
    
    return schemas.InstagramSettingsResponse(
        access_token=settings.access_token,
        has_token=bool(settings.access_token),
        featured_image_url=settings.featured_image_url,
    )


@router.get("/media", response_model=schemas.InstagramMediaResponse)
async def get_media(db: Session = Depends(get_db)) -> schemas.InstagramMediaResponse:
    """Instagram 미디어 목록을 조회합니다."""
    instagram_settings = service.get_instagram_settings(db)
    
    if not instagram_settings.access_token:
        return schemas.InstagramMediaResponse(
            featured_image_url=instagram_settings.featured_image_url,
            media=[],
        )
    
    try:
        media_data = await service.get_instagram_media(instagram_settings.access_token)
        
        # 미디어 데이터를 응답 형식으로 변환
        media_items = []
        for item in media_data:
            # 이미지 타입만 필터링
            if item.get("media_type") == "IMAGE":
                media_items.append(
                    schemas.InstagramMediaItem(
                        id=item.get("id", ""),
                        imageUrl=item.get("media_url", ""),
                        caption=item.get("caption", "")[:100] if item.get("caption") else "",
                        permalink=item.get("permalink", ""),
                    )
                )
        
        return schemas.InstagramMediaResponse(
            featured_image_url=instagram_settings.featured_image_url,
            media=media_items,
        )
    except Exception:
        # 오류 발생 시 빈 응답 반환
        return schemas.InstagramMediaResponse(
            featured_image_url=instagram_settings.featured_image_url,
            media=[],
        )

