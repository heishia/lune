from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import get_admin_user_id

from . import schemas, service

router = APIRouter(prefix="/banners", tags=["banners"])


@router.get("", response_model=schemas.BannersListResponse)
def get_banners(
    active_only: bool = Query(False, description="활성 배너만 조회"),
    db: Session = Depends(get_db),
) -> schemas.BannersListResponse:
    """배너 목록 조회 (공개)"""
    banners, total = service.list_banners(db=db, active_only=active_only)
    return schemas.BannersListResponse(
        banners=[
            schemas.BannerResponse(
                id=str(b.id),
                title=b.title,
                banner_image=b.banner_image,
                content_blocks=b.content_blocks or [],
                is_active=b.is_active,
                display_order=b.display_order,
                created_at=b.created_at,
                updated_at=b.updated_at,
            )
            for b in banners
        ],
        total=total,
    )


@router.get("/active", response_model=schemas.BannersListResponse)
def get_active_banners(
    db: Session = Depends(get_db),
) -> schemas.BannersListResponse:
    """활성 배너만 조회 (공개)"""
    banners, total = service.list_banners(db=db, active_only=True)
    return schemas.BannersListResponse(
        banners=[
            schemas.BannerResponse(
                id=str(b.id),
                title=b.title,
                banner_image=b.banner_image,
                content_blocks=b.content_blocks or [],
                is_active=b.is_active,
                display_order=b.display_order,
                created_at=b.created_at,
                updated_at=b.updated_at,
            )
            for b in banners
        ],
        total=total,
    )


@router.get("/{banner_id}", response_model=schemas.BannerResponse)
def get_banner(
    banner_id: str,
    db: Session = Depends(get_db),
) -> schemas.BannerResponse:
    """배너 상세 조회 (공개)"""
    banner = service.get_banner(db=db, banner_id=banner_id)
    return schemas.BannerResponse(
        id=str(banner.id),
        title=banner.title,
        banner_image=banner.banner_image,
        content_blocks=banner.content_blocks or [],
        is_active=banner.is_active,
        display_order=banner.display_order,
        created_at=banner.created_at,
        updated_at=banner.updated_at,
    )


@router.post("", response_model=schemas.BannerResponse)
def create_banner(
    payload: schemas.CreateBannerRequest,
    admin_id: str = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
) -> schemas.BannerResponse:
    """배너 생성 (관리자 전용)"""
    banner = service.create_banner(db=db, payload=payload)
    return schemas.BannerResponse(
        id=str(banner.id),
        title=banner.title,
        banner_image=banner.banner_image,
        content_blocks=banner.content_blocks or [],
        is_active=banner.is_active,
        display_order=banner.display_order,
        created_at=banner.created_at,
        updated_at=banner.updated_at,
    )


@router.put("/{banner_id}", response_model=schemas.BannerResponse)
def update_banner(
    banner_id: str,
    payload: schemas.UpdateBannerRequest,
    admin_id: str = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
) -> schemas.BannerResponse:
    """배너 수정 (관리자 전용)"""
    banner = service.update_banner(db=db, banner_id=banner_id, payload=payload)
    return schemas.BannerResponse(
        id=str(banner.id),
        title=banner.title,
        banner_image=banner.banner_image,
        content_blocks=banner.content_blocks or [],
        is_active=banner.is_active,
        display_order=banner.display_order,
        created_at=banner.created_at,
        updated_at=banner.updated_at,
    )


@router.delete("/{banner_id}")
def delete_banner(
    banner_id: str,
    admin_id: str = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
) -> dict:
    """배너 삭제 (관리자 전용)"""
    service.delete_banner(db=db, banner_id=banner_id)
    return {"success": True}

