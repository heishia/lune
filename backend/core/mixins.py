"""SQLAlchemy 모델 믹스인

공통 기능을 제공하는 믹스인 클래스들입니다.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, Boolean
from sqlalchemy.orm import declared_attr
from sqlalchemy.ext.declarative import declared_attr as sqlalchemy_declared_attr


class TimestampMixin:
    """타임스탬프 믹스인
    
    created_at, updated_at 컬럼을 자동으로 추가합니다.
    """
    
    @declared_attr
    def created_at(cls):
        return Column(DateTime, default=datetime.utcnow, nullable=False)
    
    @declared_attr
    def updated_at(cls):
        return Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class SoftDeleteMixin:
    """Soft Delete 믹스인
    
    실제 삭제 대신 deleted_at 컬럼을 설정하여 논리적 삭제를 수행합니다.
    
    Usage:
        class User(Base, SoftDeleteMixin):
            __tablename__ = "users"
            ...
        
        # 삭제
        user.soft_delete()
        
        # 복구
        user.restore()
        
        # 쿼리 (삭제되지 않은 것만)
        query = db.query(User).filter(User.is_deleted == False)
    """
    
    @declared_attr
    def deleted_at(cls):
        return Column(DateTime, nullable=True, default=None)
    
    @declared_attr
    def is_deleted(cls):
        return Column(Boolean, default=False, nullable=False)
    
    def soft_delete(self) -> None:
        """논리적 삭제 수행"""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
    
    def restore(self) -> None:
        """삭제 복구"""
        self.is_deleted = False
        self.deleted_at = None
    
    @classmethod
    def active_query(cls, query):
        """삭제되지 않은 항목만 필터링하는 쿼리 헬퍼"""
        return query.filter(cls.is_deleted == False)


class AuditMixin(TimestampMixin):
    """감사 믹스인
    
    생성자/수정자 정보와 타임스탬프를 추가합니다.
    """
    
    @declared_attr
    def created_by(cls):
        return Column(String(36), nullable=True)
    
    @declared_attr
    def updated_by(cls):
        return Column(String(36), nullable=True)
    
    def set_created_by(self, user_id: str) -> None:
        """생성자 설정"""
        self.created_by = user_id
    
    def set_updated_by(self, user_id: str) -> None:
        """수정자 설정"""
        self.updated_by = user_id
        self.updated_at = datetime.utcnow()


# Soft Delete 쿼리 헬퍼 함수

def exclude_deleted(query, model):
    """삭제된 항목 제외 필터"""
    if hasattr(model, 'is_deleted'):
        return query.filter(model.is_deleted == False)
    return query


def include_deleted(query, model):
    """삭제된 항목 포함 (관리자용)"""
    return query


def only_deleted(query, model):
    """삭제된 항목만 조회 (관리자용)"""
    if hasattr(model, 'is_deleted'):
        return query.filter(model.is_deleted == True)
    return query.filter(False)  # 빈 결과


# String import for AuditMixin (optional dependency)
try:
    from sqlalchemy import String
except ImportError:
    String = None

