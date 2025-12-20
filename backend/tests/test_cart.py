"""장바구니 API 테스트"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.core import models


@pytest.fixture
def test_product(db: Session, test_product_data: dict) -> models.Product:
    """테스트용 상품"""
    product = models.Product(**test_product_data)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


class TestAddToCart:
    """장바구니 추가 테스트"""
    
    def test_add_to_cart_success(
        self,
        authenticated_client: tuple,
        test_product: models.Product,
    ):
        """정상 장바구니 추가"""
        client, user = authenticated_client
        
        cart_data = {
            "productId": test_product.id,
            "quantity": 2,
            "color": "Black",
            "size": "M",
        }
        
        response = client.post("/cart", json=cart_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    def test_add_to_cart_nonexistent_product(self, authenticated_client: tuple):
        """존재하지 않는 상품"""
        client, user = authenticated_client
        
        cart_data = {
            "productId": 99999,
            "quantity": 1,
            "color": "Black",
            "size": "M",
        }
        
        response = client.post("/cart", json=cart_data)
        
        assert response.status_code == 404


class TestGetCart:
    """장바구니 조회 테스트"""
    
    def test_get_cart_empty(self, authenticated_client: tuple):
        """빈 장바구니"""
        client, user = authenticated_client
        
        response = client.get("/cart")
        
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
    
    def test_get_cart_with_items(
        self,
        authenticated_client: tuple,
        test_product: models.Product,
    ):
        """상품이 있는 장바구니"""
        client, user = authenticated_client
        
        # 장바구니에 추가
        client.post("/cart", json={
            "productId": test_product.id,
            "quantity": 2,
            "color": "Black",
            "size": "M",
        })
        
        response = client.get("/cart")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["quantity"] == 2


class TestUpdateCartQuantity:
    """장바구니 수량 변경 테스트"""
    
    def test_update_quantity_success(
        self,
        authenticated_client: tuple,
        test_product: models.Product,
        db: Session,
    ):
        """정상 수량 변경"""
        client, user = authenticated_client
        
        # 장바구니에 추가
        client.post("/cart", json={
            "productId": test_product.id,
            "quantity": 2,
            "color": "Black",
            "size": "M",
        })
        
        # 수량 변경
        response = client.put(f"/cart/{test_product.id}", json={"quantity": 5})
        
        assert response.status_code == 200
        
        # 변경 확인
        cart_response = client.get("/cart")
        assert cart_response.json()["items"][0]["quantity"] == 5


class TestRemoveFromCart:
    """장바구니 삭제 테스트"""
    
    def test_remove_from_cart_success(
        self,
        authenticated_client: tuple,
        test_product: models.Product,
    ):
        """정상 삭제"""
        client, user = authenticated_client
        
        # 장바구니에 추가
        client.post("/cart", json={
            "productId": test_product.id,
            "quantity": 2,
            "color": "Black",
            "size": "M",
        })
        
        # 삭제
        response = client.delete(f"/cart/{test_product.id}")
        
        assert response.status_code == 200
        
        # 삭제 확인
        cart_response = client.get("/cart")
        assert cart_response.json()["items"] == []

