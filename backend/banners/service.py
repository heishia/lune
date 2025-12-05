from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Tuple
from uuid import uuid4

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.core import models
from backend.core.exceptions import NotFoundError

from . import schemas


def list_banners(
    db: Session,
    active_only: bool = False,
) -> Tuple[List[models.Banner], int]:
    """배너 목록 조회"""
    query = db.query(models.Banner)
    
    if active_only:
        query = query.filter(models.Banner.is_active == True)
    
    query = query.order_by(models.Banner.display_order.asc(), models.Banner.created_at.desc())
    
    total = query.with_entities(func.count(models.Banner.id)).scalar() or 0
    banners = query.all()
    
    return banners, total


def get_banner(db: Session, banner_id: str) -> models.Banner:
    """배너 상세 조회"""
    banner = db.query(models.Banner).filter(models.Banner.id == banner_id).first()
    if not banner:
        raise NotFoundError("배너를 찾을 수 없습니다.")
    return banner


def create_banner(db: Session, payload: schemas.CreateBannerRequest) -> models.Banner:
    """배너 생성"""
    banner = models.Banner(
        id=str(uuid4()),
        title=payload.title,
        banner_image=payload.banner_image,
        content_blocks=[block.model_dump() for block in payload.content_blocks],
        is_active=payload.is_active,
        display_order=payload.display_order,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(banner)
    db.commit()
    db.refresh(banner)
    return banner


def update_banner(
    db: Session,
    banner_id: str,
    payload: schemas.UpdateBannerRequest,
) -> models.Banner:
    """배너 수정"""
    banner = get_banner(db, banner_id)
    
    if payload.title is not None:
        banner.title = payload.title
    if payload.banner_image is not None:
        banner.banner_image = payload.banner_image
    if payload.content_blocks is not None:
        banner.content_blocks = [block.model_dump() for block in payload.content_blocks]
    if payload.is_active is not None:
        banner.is_active = payload.is_active
    if payload.display_order is not None:
        banner.display_order = payload.display_order
    
    banner.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(banner)
    return banner


def delete_banner(db: Session, banner_id: str) -> None:
    """배너 삭제"""
    banner = get_banner(db, banner_id)
    db.delete(banner)
    db.commit()

