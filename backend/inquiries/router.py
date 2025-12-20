"""문의 라우터"""
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import get_current_user_id, get_admin_user_id

from . import schemas, service

router = APIRouter(prefix="/inquiries", tags=["inquiries"])


@router.post("", response_model=schemas.InquiryResponse)
def create_inquiry(
    payload: schemas.InquiryCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> schemas.InquiryResponse:
    """문의 생성"""
    inquiry = service.create_inquiry(
        db=db,
        user_id=user_id,
        inquiry_type=payload.type,
        title=payload.title,
        content=payload.content,
        product_id=payload.product_id,
    )
    
    return schemas.InquiryResponse(**inquiry)


@router.get("", response_model=schemas.InquiryListResponse)
def get_my_inquiries(
    limit: int = 20,
    offset: int = 0,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> schemas.InquiryListResponse:
    """내 문의 목록 조회"""
    inquiries, total = service.get_user_inquiries(
        db=db,
        user_id=user_id,
        limit=limit,
        offset=offset,
    )
    
    return schemas.InquiryListResponse(
        inquiries=[schemas.InquiryResponse(**i) for i in inquiries],
        total=total,
    )


@router.get("/{inquiry_id}", response_model=schemas.InquiryResponse)
def get_inquiry(
    inquiry_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> schemas.InquiryResponse:
    """문의 상세 조회"""
    inquiry = service.get_inquiry(
        db=db,
        inquiry_id=inquiry_id,
        user_id=user_id,
    )
    
    return schemas.InquiryResponse(**inquiry)


@router.delete("/{inquiry_id}")
def delete_inquiry(
    inquiry_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> dict:
    """문의 삭제 (미답변 상태만)"""
    success = service.delete_inquiry(
        db=db,
        inquiry_id=inquiry_id,
        user_id=user_id,
    )
    
    return {
        "success": success,
        "message": "문의가 삭제되었습니다." if success else "문의를 삭제할 수 없습니다.",
    }


# 관리자 엔드포인트

@router.get("/admin/all", response_model=schemas.InquiryListResponse)
def get_all_inquiries(
    is_answered: Optional[bool] = None,
    inquiry_type: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    admin_id: str = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
) -> schemas.InquiryListResponse:
    """모든 문의 조회 (관리자)"""
    inquiries, total = service.get_all_inquiries(
        db=db,
        is_answered=is_answered,
        inquiry_type=inquiry_type,
        limit=limit,
        offset=offset,
    )
    
    return schemas.InquiryListResponse(
        inquiries=[schemas.InquiryResponse(**i) for i in inquiries],
        total=total,
    )


@router.post("/{inquiry_id}/answer", response_model=schemas.InquiryAnswerResponse)
def answer_inquiry(
    inquiry_id: str,
    payload: schemas.InquiryAnswerRequest,
    admin_id: str = Depends(get_admin_user_id),
    db: Session = Depends(get_db),
) -> schemas.InquiryAnswerResponse:
    """문의 답변 (관리자)"""
    service.answer_inquiry(
        db=db,
        inquiry_id=inquiry_id,
        answer=payload.answer,
        admin_name="관리자",  # TODO: 실제 관리자 이름 조회
    )
    
    return schemas.InquiryAnswerResponse(
        success=True,
        message="답변이 등록되었습니다.",
    )

