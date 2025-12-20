"""API v1 공통 의존성

모든 v1 엔드포인트에서 사용되는 공통 의존성을 정의합니다.
"""
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import (
    get_current_user_id,
    get_current_user_payload,
    get_admin_user_id,
)

# 타입 별칭 정의
DBSession = Annotated[Session, Depends(get_db)]
CurrentUserId = Annotated[str, Depends(get_current_user_id)]
CurrentUserPayload = Annotated[dict, Depends(get_current_user_payload)]
AdminUserId = Annotated[str, Depends(get_admin_user_id)]

