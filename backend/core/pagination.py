"""페이지네이션 유틸리티

Offset 기반 및 Cursor 기반 페이지네이션을 제공합니다.
"""
import base64
import json
from datetime import datetime
from typing import Any, Generic, List, Optional, TypeVar, Callable

from pydantic import BaseModel

T = TypeVar("T")


class CursorInfo(BaseModel):
    """커서 정보"""
    id: Any
    created_at: str


class CursorPaginatedResponse(BaseModel, Generic[T]):
    """Cursor 기반 페이지네이션 응답"""
    items: List[T]
    next_cursor: Optional[str] = None
    has_more: bool = False
    total: Optional[int] = None  # 선택적 (count 쿼리 비용이 크면 생략)


class OffsetPaginatedResponse(BaseModel, Generic[T]):
    """Offset 기반 페이지네이션 응답"""
    items: List[T]
    total: int
    page: int
    total_pages: int
    has_next: bool
    has_prev: bool


def encode_cursor(id: Any, created_at: datetime) -> str:
    """커서 인코딩
    
    Args:
        id: 엔티티 ID
        created_at: 생성 시간
    
    Returns:
        Base64 인코딩된 커서 문자열
    """
    cursor_data = {
        "id": str(id),
        "created_at": created_at.isoformat() if isinstance(created_at, datetime) else created_at,
    }
    json_str = json.dumps(cursor_data)
    return base64.urlsafe_b64encode(json_str.encode()).decode()


def decode_cursor(cursor: str) -> CursorInfo:
    """커서 디코딩
    
    Args:
        cursor: Base64 인코딩된 커서 문자열
    
    Returns:
        CursorInfo 객체
    
    Raises:
        ValueError: 잘못된 커서 형식
    """
    try:
        json_str = base64.urlsafe_b64decode(cursor.encode()).decode()
        data = json.loads(json_str)
        return CursorInfo(**data)
    except Exception as e:
        raise ValueError(f"잘못된 커서 형식입니다: {e}")


def paginate_offset(
    items: List[T],
    total: int,
    page: int,
    limit: int,
) -> OffsetPaginatedResponse[T]:
    """Offset 페이지네이션 응답 생성
    
    Args:
        items: 현재 페이지 아이템
        total: 전체 아이템 수
        page: 현재 페이지 (1부터 시작)
        limit: 페이지당 아이템 수
    """
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    
    return OffsetPaginatedResponse(
        items=items,
        total=total,
        page=page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1,
    )


def paginate_cursor(
    items: List[Any],
    limit: int,
    id_getter: Callable[[Any], Any] = lambda x: x.id,
    created_at_getter: Callable[[Any], datetime] = lambda x: x.created_at,
    total: Optional[int] = None,
) -> dict:
    """Cursor 페이지네이션 응답 생성
    
    Args:
        items: 현재 페이지 아이템 (limit+1개를 조회해서 has_more 판단)
        limit: 요청한 아이템 수
        id_getter: ID 추출 함수
        created_at_getter: created_at 추출 함수
        total: 전체 아이템 수 (선택적)
    
    Returns:
        페이지네이션 응답 딕셔너리
    """
    has_more = len(items) > limit
    
    # limit+1로 조회했으면 마지막 아이템 제거
    if has_more:
        items = items[:limit]
    
    next_cursor = None
    if has_more and items:
        last_item = items[-1]
        next_cursor = encode_cursor(
            id_getter(last_item),
            created_at_getter(last_item),
        )
    
    response = {
        "items": items,
        "next_cursor": next_cursor,
        "has_more": has_more,
    }
    
    if total is not None:
        response["total"] = total
    
    return response


# 공통 페이지네이션 파라미터
DEFAULT_PAGE = 1
DEFAULT_LIMIT = 20
MAX_LIMIT = 100


def normalize_pagination_params(
    page: Optional[int] = None,
    limit: Optional[int] = None,
) -> tuple[int, int]:
    """페이지네이션 파라미터 정규화
    
    Args:
        page: 페이지 번호 (1부터 시작)
        limit: 페이지당 아이템 수
    
    Returns:
        (page, limit) 튜플
    """
    page = max(page or DEFAULT_PAGE, 1)
    limit = max(min(limit or DEFAULT_LIMIT, MAX_LIMIT), 1)
    return page, limit

