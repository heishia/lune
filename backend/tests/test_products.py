"""상품 API 테스트"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.core import models


class TestGetProducts:
    """상품 목록 조회 테스트"""
    
    def test_get_products_empty(self, client: TestClient):
        """빈 상품 목록"""
        response = client.get("/products")
        
        assert response.status_code == 200
        data = response.json()
        assert data["products"] == []
        assert data["total"] == 0
    
    def test_get_products_with_data(self, client: TestClient, db: Session, test_product_data: dict):
        """상품이 있는 경우"""
        # 상품 직접 생성
        product = models.Product(**test_product_data)
        db.add(product)
        db.commit()
        
        response = client.get("/products")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) == 1
        assert data["products"][0]["name"] == test_product_data["name"]
    
    def test_get_products_pagination(self, client: TestClient, db: Session, test_product_data: dict):
        """페이지네이션 테스트"""
        # 상품 5개 생성
        for i in range(5):
            product_data = {**test_product_data, "name": f"상품 {i+1}"}
            product = models.Product(**product_data)
            db.add(product)
        db.commit()
        
        # 첫 페이지 (limit=2)
        response = client.get("/products?page=1&limit=2")
        data = response.json()
        
        assert response.status_code == 200
        assert len(data["products"]) == 2
        assert data["total"] == 5
        assert data["total_pages"] == 3
    
    def test_get_products_filter_category(self, client: TestClient, db: Session, test_product_data: dict):
        """카테고리 필터링"""
        # BEST 카테고리 상품
        product1 = models.Product(**{**test_product_data, "name": "BEST 상품", "category": ["BEST"]})
        db.add(product1)
        
        # NEW 카테고리 상품
        product2 = models.Product(**{**test_product_data, "name": "NEW 상품", "category": ["NEW"]})
        db.add(product2)
        db.commit()
        
        # BEST 카테고리만 조회
        response = client.get("/products?category=BEST")
        data = response.json()
        
        assert response.status_code == 200
        assert len(data["products"]) == 1
        assert data["products"][0]["name"] == "BEST 상품"


class TestGetProduct:
    """상품 상세 조회 테스트"""
    
    def test_get_product_success(self, client: TestClient, db: Session, test_product_data: dict):
        """정상 조회"""
        product = models.Product(**test_product_data)
        db.add(product)
        db.commit()
        db.refresh(product)
        
        response = client.get(f"/products/{product.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == test_product_data["name"]
        assert data["price"] == test_product_data["price"]
    
    def test_get_product_not_found(self, client: TestClient):
        """존재하지 않는 상품"""
        response = client.get("/products/99999")
        
        assert response.status_code == 404
    
    def test_get_product_increments_view_count(self, client: TestClient, db: Session, test_product_data: dict):
        """조회수 증가 확인"""
        product = models.Product(**test_product_data)
        db.add(product)
        db.commit()
        db.refresh(product)
        
        initial_view_count = product.view_count
        
        # 상품 조회
        client.get(f"/products/{product.id}")
        
        # DB에서 다시 조회
        db.refresh(product)
        
        assert product.view_count == initial_view_count + 1

