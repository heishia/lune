"""상품 Repository"""
from typing import Optional, List, Tuple
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload, selectinload

from backend.core.models import Product, Review
from .base import BaseRepository


class ProductRepository(BaseRepository[Product]):
    """상품 데이터 접근 Repository"""
    
    def __init__(self, db: Session):
        super().__init__(Product, db)
    
    def get_active_products(
        self,
        *,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Product]:
        """활성 상품 목록 조회"""
        return self.db.query(Product).filter(
            Product.is_active == True
        ).order_by(Product.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_by_category(
        self,
        category: str,
        *,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Product]:
        """카테고리별 상품 조회"""
        return self.db.query(Product).filter(
            Product.is_active == True,
            Product.category.any(category)
        ).order_by(Product.created_at.desc()).offset(skip).limit(limit).all()
    
    def search(
        self,
        query: str,
        *,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[Product], int]:
        """상품 검색 (이름 기준)"""
        pattern = f"%{query}%"
        base_query = self.db.query(Product).filter(
            Product.is_active == True,
            Product.name.ilike(pattern)
        )
        
        if category:
            base_query = base_query.filter(Product.category.any(category))
        
        total = base_query.with_entities(func.count(Product.id)).scalar() or 0
        products = base_query.order_by(
            Product.created_at.desc()
        ).offset(skip).limit(limit).all()
        
        return products, total
    
    def get_with_reviews(self, product_id: int) -> Optional[Product]:
        """리뷰 포함 상품 조회 (N+1 방지)"""
        return self.db.query(Product).options(
            selectinload(Product.order_items)
        ).filter(Product.id == product_id).first()
    
    def get_new_products(self, limit: int = 10) -> List[Product]:
        """신상품 조회"""
        return self.db.query(Product).filter(
            Product.is_active == True,
            Product.is_new == True
        ).order_by(Product.created_at.desc()).limit(limit).all()
    
    def get_best_products(self, limit: int = 10) -> List[Product]:
        """베스트 상품 조회"""
        return self.db.query(Product).filter(
            Product.is_active == True,
            Product.is_best == True
        ).order_by(Product.view_count.desc()).limit(limit).all()
    
    def get_by_ids(self, product_ids: List[int]) -> List[Product]:
        """여러 ID로 상품 일괄 조회 (벌크 조회)"""
        if not product_ids:
            return []
        return self.db.query(Product).filter(
            Product.id.in_(product_ids)
        ).all()
    
    def increment_view_count(self, product_id: int) -> None:
        """조회수 증가"""
        self.db.query(Product).filter(
            Product.id == product_id
        ).update({"view_count": Product.view_count + 1})
        self.db.commit()
    
    def update_stock(self, product_id: int, quantity_delta: int) -> bool:
        """재고 수량 업데이트
        
        Args:
            product_id: 상품 ID
            quantity_delta: 변경량 (양수: 증가, 음수: 감소)
        
        Returns:
            성공 여부
        """
        product = self.get_by_id(product_id)
        if not product:
            return False
        
        new_quantity = product.stock_quantity + quantity_delta
        if new_quantity < 0:
            return False
        
        product.stock_quantity = new_quantity
        product.updated_at = datetime.utcnow()
        self.db.commit()
        return True
    
    def count_active(self) -> int:
        """활성 상품 수 조회"""
        return self.db.query(func.count(Product.id)).filter(
            Product.is_active == True
        ).scalar() or 0

