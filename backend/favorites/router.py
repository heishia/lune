"""위시리스트 라우터"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import get_current_user_id

from . import schemas, service

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=schemas.FavoriteListResponse)
def get_my_favorites(
    limit: int = 50,
    offset: int = 0,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> schemas.FavoriteListResponse:
    """내 찜 목록 조회"""
    favorites, total = service.get_user_favorites(
        db=db,
        user_id=user_id,
        limit=limit,
        offset=offset,
    )
    
    return schemas.FavoriteListResponse(
        favorites=[
            schemas.FavoriteResponse(
                id=f.id,
                product_id=f.product_id,
                created_at=f.created_at,
                product=schemas.FavoriteProductInfo(
                    id=f.product.id,
                    name=f.product.name,
                    price=f.product.price,
                    original_price=f.product.original_price,
                    image_url=f.product.image_url,
                    is_active=f.product.is_active,
                ) if f.product else None,
            )
            for f in favorites
        ],
        total=total,
    )


@router.post("/{product_id}", response_model=schemas.FavoriteToggleResponse)
def toggle_favorite(
    product_id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> schemas.FavoriteToggleResponse:
    """찜 토글 (추가/제거)"""
    is_favorited, message = service.toggle_favorite(
        db=db,
        user_id=user_id,
        product_id=product_id,
    )
    
    return schemas.FavoriteToggleResponse(
        is_favorited=is_favorited,
        message=message,
    )


@router.get("/{product_id}/status", response_model=schemas.FavoriteStatusResponse)
def get_favorite_status(
    product_id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> schemas.FavoriteStatusResponse:
    """상품의 찜 상태 조회"""
    is_favorited = service.is_favorited(
        db=db,
        user_id=user_id,
        product_id=product_id,
    )
    favorite_count = service.get_favorite_count(db=db, product_id=product_id)
    
    return schemas.FavoriteStatusResponse(
        is_favorited=is_favorited,
        favorite_count=favorite_count,
    )


@router.delete("/{product_id}")
def remove_favorite(
    product_id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    """찜 제거"""
    service.remove_from_favorites(
        db=db,
        user_id=user_id,
        product_id=product_id,
    )
    return {"success": True, "message": "찜 목록에서 제거되었습니다."}

