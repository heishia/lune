from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Tuple
from uuid import uuid4

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.core import models
from backend.core.exceptions import NotFoundError

from . import schemas


def list_contents(
    db: Session,
    content_type: Optional[str] = None,
    reference_id: Optional[str] = None,
) -> Tuple[List[models.Content], int]:
    """콘텐츠 목록 조회"""
    query = db.query(models.Content)
    
    if content_type:
        query = query.filter(models.Content.content_type == content_type)
    
    if reference_id:
        query = query.filter(models.Content.reference_id == reference_id)
    
    query = query.order_by(models.Content.updated_at.desc())
    
    total = query.with_entities(func.count(models.Content.id)).scalar() or 0
    contents = query.all()
    
    return contents, total


def get_content(db: Session, content_id: str) -> models.Content:
    """콘텐츠 상세 조회"""
    content = db.query(models.Content).filter(models.Content.id == content_id).first()
    if not content:
        raise NotFoundError("콘텐츠를 찾을 수 없습니다.")
    return content


def get_content_by_reference(db: Session, content_type: str, reference_id: str) -> Optional[models.Content]:
    """참조 ID로 콘텐츠 조회"""
    return db.query(models.Content).filter(
        models.Content.content_type == content_type,
        models.Content.reference_id == reference_id,
    ).first()


def create_content(
    db: Session,
    payload: schemas.CreateContentRequest,
    user_id: Optional[str] = None,
) -> models.Content:
    """콘텐츠 생성"""
    content = models.Content(
        id=str(uuid4()),
        title=payload.title,
        content_type=payload.content_type,
        reference_id=payload.reference_id,
        blocks=[block.model_dump() for block in payload.blocks],
        thumbnail_url=payload.thumbnail_url,
        is_published=payload.is_published,
        created_by=user_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(content)
    db.commit()
    db.refresh(content)
    return content


def update_content(
    db: Session,
    content_id: str,
    payload: schemas.UpdateContentRequest,
) -> models.Content:
    """콘텐츠 수정"""
    content = get_content(db, content_id)
    
    if payload.title is not None:
        content.title = payload.title
    if payload.blocks is not None:
        content.blocks = [block.model_dump() for block in payload.blocks]
    if payload.thumbnail_url is not None:
        content.thumbnail_url = payload.thumbnail_url
    if payload.is_published is not None:
        content.is_published = payload.is_published
    
    content.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(content)
    return content


def delete_content(db: Session, content_id: str) -> None:
    """콘텐츠 삭제"""
    content = get_content(db, content_id)
    db.delete(content)
    db.commit()

