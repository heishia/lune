from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import get_admin_user_id, get_current_user_id

from . import schemas, service

router = APIRouter(prefix="/contents", tags=["contents"])


@router.get("", response_model=schemas.ContentsListResponse)
def get_contents(
    content_type: Optional[str] = Query(default=None),
    reference_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> schemas.ContentsListResponse:
    """콘텐츠 목록 조회"""
    contents, total = service.list_contents(
        db=db,
        content_type=content_type,
        reference_id=reference_id,
    )
    return schemas.ContentsListResponse(
        contents=[
            schemas.ContentResponse(
                id=str(c.id),
                title=c.title,
                content_type=c.content_type,
                reference_id=c.reference_id,
                blocks=c.blocks or [],
                thumbnail_url=c.thumbnail_url,
                is_published=c.is_published,
                created_by=str(c.created_by) if c.created_by else None,
                created_at=c.created_at,
                updated_at=c.updated_at,
            )
            for c in contents
        ],
        total=total,
    )


@router.get("/by-reference/{content_type}/{reference_id}", response_model=Optional[schemas.ContentResponse])
def get_content_by_reference(
    content_type: str,
    reference_id: str,
    db: Session = Depends(get_db),
) -> Optional[schemas.ContentResponse]:
    """참조 ID로 콘텐츠 조회 (상품ID, 배너ID 등)"""
    content = service.get_content_by_reference(
        db=db,
        content_type=content_type,
        reference_id=reference_id,
    )
    if not content:
        return None
    
    return schemas.ContentResponse(
        id=str(content.id),
        title=content.title,
        content_type=content.content_type,
        reference_id=content.reference_id,
        blocks=content.blocks or [],
        thumbnail_url=content.thumbnail_url,
        is_published=content.is_published,
        created_by=str(content.created_by) if content.created_by else None,
        created_at=content.created_at,
        updated_at=content.updated_at,
    )


@router.get("/{content_id}", response_model=schemas.ContentResponse)
def get_content(
    content_id: str,
    db: Session = Depends(get_db),
) -> schemas.ContentResponse:
    """콘텐츠 상세 조회"""
    content = service.get_content(db=db, content_id=content_id)
    return schemas.ContentResponse(
        id=str(content.id),
        title=content.title,
        content_type=content.content_type,
        reference_id=content.reference_id,
        blocks=content.blocks or [],
        thumbnail_url=content.thumbnail_url,
        is_published=content.is_published,
        created_by=str(content.created_by) if content.created_by else None,
        created_at=content.created_at,
        updated_at=content.updated_at,
    )


@router.post("", response_model=schemas.ContentResponse)
def create_content(
    payload: schemas.CreateContentRequest,
    admin_id: str = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
) -> schemas.ContentResponse:
    """콘텐츠 생성 (관리자 전용)"""
    content = service.create_content(db=db, payload=payload, user_id=admin_id)
    return schemas.ContentResponse(
        id=str(content.id),
        title=content.title,
        content_type=content.content_type,
        reference_id=content.reference_id,
        blocks=content.blocks or [],
        thumbnail_url=content.thumbnail_url,
        is_published=content.is_published,
        created_by=str(content.created_by) if content.created_by else None,
        created_at=content.created_at,
        updated_at=content.updated_at,
    )


@router.put("/{content_id}", response_model=schemas.ContentResponse)
def update_content(
    content_id: str,
    payload: schemas.UpdateContentRequest,
    admin_id: str = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
) -> schemas.ContentResponse:
    """콘텐츠 수정 (관리자 전용)"""
    content = service.update_content(db=db, content_id=content_id, payload=payload)
    return schemas.ContentResponse(
        id=str(content.id),
        title=content.title,
        content_type=content.content_type,
        reference_id=content.reference_id,
        blocks=content.blocks or [],
        thumbnail_url=content.thumbnail_url,
        is_published=content.is_published,
        created_by=str(content.created_by) if content.created_by else None,
        created_at=content.created_at,
        updated_at=content.updated_at,
    )


@router.delete("/{content_id}")
def delete_content(
    content_id: str,
    admin_id: str = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
) -> dict:
    """콘텐츠 삭제 (관리자 전용)"""
    service.delete_content(db=db, content_id=content_id)
    return {"success": True}

