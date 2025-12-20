"""기본 Repository 클래스

모든 Repository의 공통 기능을 정의합니다.
"""
from typing import Generic, TypeVar, Type, Optional, List, Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.core.models import Base
from backend.core.exceptions import NotFoundError

# 모델 타입 변수
ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """기본 Repository 클래스
    
    CRUD 및 공통 쿼리 메서드를 제공합니다.
    
    Example:
        class UserRepository(BaseRepository[User]):
            pass
        
        repo = UserRepository(User, db)
        user = repo.get_by_id(user_id)
    """
    
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db
    
    def get_by_id(self, id: Any) -> Optional[ModelType]:
        """ID로 단일 엔티티 조회"""
        return self.db.query(self.model).filter(self.model.id == id).first()
    
    def get_by_id_or_raise(self, id: Any, error_message: str = "엔티티를 찾을 수 없습니다.") -> ModelType:
        """ID로 단일 엔티티 조회 (없으면 예외)"""
        entity = self.get_by_id(id)
        if not entity:
            raise NotFoundError(error_message)
        return entity
    
    def get_all(self) -> List[ModelType]:
        """모든 엔티티 조회"""
        return self.db.query(self.model).all()
    
    def get_multi(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ModelType]:
        """페이지네이션된 엔티티 목록 조회"""
        return self.db.query(self.model).offset(skip).limit(limit).all()
    
    def count(self) -> int:
        """전체 엔티티 수 조회"""
        return self.db.query(func.count(self.model.id)).scalar() or 0
    
    def create(self, entity: ModelType) -> ModelType:
        """새 엔티티 생성"""
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity
    
    def create_many(self, entities: List[ModelType]) -> List[ModelType]:
        """여러 엔티티 일괄 생성"""
        self.db.add_all(entities)
        self.db.commit()
        for entity in entities:
            self.db.refresh(entity)
        return entities
    
    def update(self, entity: ModelType) -> ModelType:
        """엔티티 업데이트"""
        self.db.commit()
        self.db.refresh(entity)
        return entity
    
    def delete(self, entity: ModelType) -> None:
        """엔티티 삭제"""
        self.db.delete(entity)
        self.db.commit()
    
    def delete_by_id(self, id: Any) -> bool:
        """ID로 엔티티 삭제"""
        entity = self.get_by_id(id)
        if entity:
            self.delete(entity)
            return True
        return False
    
    def exists(self, id: Any) -> bool:
        """엔티티 존재 여부 확인"""
        return self.db.query(
            self.db.query(self.model).filter(self.model.id == id).exists()
        ).scalar()
    
    def flush(self) -> None:
        """변경사항 flush (커밋 없이)"""
        self.db.flush()
    
    def commit(self) -> None:
        """트랜잭션 커밋"""
        self.db.commit()
    
    def rollback(self) -> None:
        """트랜잭션 롤백"""
        self.db.rollback()

