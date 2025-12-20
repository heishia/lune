"""사용자 Repository"""
from typing import Optional, List
from datetime import datetime

from sqlalchemy.orm import Session

from backend.core.models import User
from .base import BaseRepository


class UserRepository(BaseRepository[User]):
    """사용자 데이터 접근 Repository"""
    
    def __init__(self, db: Session):
        super().__init__(User, db)
    
    def get_by_email(self, email: str) -> Optional[User]:
        """이메일로 사용자 조회"""
        return self.db.query(User).filter(User.email == email).first()
    
    def get_by_email_or_raise(self, email: str) -> User:
        """이메일로 사용자 조회 (없으면 예외)"""
        return self.get_by_id_or_raise(
            self.get_by_email(email),
            "사용자를 찾을 수 없습니다."
        )
    
    def get_active_users(self) -> List[User]:
        """활성 사용자 목록 조회"""
        return self.db.query(User).filter(User.is_active == True).all()
    
    def get_marketing_agreed_users(self) -> List[User]:
        """마케팅 동의 사용자 목록 조회"""
        return self.db.query(User).filter(
            User.is_active == True,
            User.marketing_agreed == True
        ).all()
    
    def get_admins(self) -> List[User]:
        """관리자 목록 조회"""
        return self.db.query(User).filter(
            User.is_active == True,
            User.is_admin == True
        ).all()
    
    def update_last_login(self, user: User) -> User:
        """마지막 로그인 시간 업데이트"""
        user.last_login = datetime.utcnow()
        return self.update(user)
    
    def update_points(self, user: User, points_delta: int) -> User:
        """포인트 업데이트"""
        user.points += points_delta
        user.updated_at = datetime.utcnow()
        return self.update(user)
    
    def search_by_email_or_name(self, query: str, limit: int = 20) -> List[User]:
        """이메일 또는 이름으로 사용자 검색"""
        pattern = f"%{query}%"
        return self.db.query(User).filter(
            (User.email.ilike(pattern)) | (User.name.ilike(pattern))
        ).limit(limit).all()
    
    def email_exists(self, email: str) -> bool:
        """이메일 존재 여부 확인"""
        return self.db.query(
            self.db.query(User).filter(User.email == email).exists()
        ).scalar()

