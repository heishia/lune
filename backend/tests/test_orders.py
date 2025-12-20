"""주문 API 테스트"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.core import models


@pytest.fixture
def product_with_stock(db: Session, test_product_data: dict) -> models.Product:
    """재고가 있는 테스트 상품"""
    product = models.Product(**{**test_product_data, "stock_quantity": 10})
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


class TestCreateOrder:
    """주문 생성 테스트"""
    
    def test_create_order_success(
        self,
        authenticated_client: tuple,
        db: Session,
        product_with_stock: models.Product,
    ):
        """정상 주문 생성"""
        client, user = authenticated_client
        
        order_data = {
            "items": [
                {
                    "productId": product_with_stock.id,
                    "quantity": 2,
                    "color": "Black",
                    "size": "M",
                }
            ],
            "shippingAddress": {
                "recipientName": "홍길동",
                "phone": "010-1234-5678",
                "postalCode": "12345",
                "address": "서울시 강남구",
                "addressDetail": "101동 101호",
                "deliveryMessage": "부재 시 문 앞에",
            },
            "paymentMethod": "card",
            "discountAmount": 0,
        }
        
        response = client.post("/orders", json=order_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "orderId" in data
        assert "orderNumber" in data
        
        # 재고 감소 확인
        db.refresh(product_with_stock)
        assert product_with_stock.stock_quantity == 8  # 10 - 2
    
    def test_create_order_insufficient_stock(
        self,
        authenticated_client: tuple,
        db: Session,
        product_with_stock: models.Product,
    ):
        """재고 부족 시 주문 실패"""
        client, user = authenticated_client
        
        order_data = {
            "items": [
                {
                    "productId": product_with_stock.id,
                    "quantity": 100,  # 재고(10)보다 많이 주문
                    "color": "Black",
                    "size": "M",
                }
            ],
            "shippingAddress": {
                "recipientName": "홍길동",
                "phone": "010-1234-5678",
                "postalCode": "12345",
                "address": "서울시 강남구",
                "addressDetail": "",
                "deliveryMessage": "",
            },
            "paymentMethod": "card",
            "discountAmount": 0,
        }
        
        response = client.post("/orders", json=order_data)
        
        assert response.status_code == 400
        assert "재고가 부족" in response.json()["error"]
    
    def test_create_order_empty_items(self, authenticated_client: tuple):
        """빈 주문 아이템"""
        client, user = authenticated_client
        
        order_data = {
            "items": [],
            "shippingAddress": {
                "recipientName": "홍길동",
                "phone": "010-1234-5678",
                "postalCode": "12345",
                "address": "서울시 강남구",
                "addressDetail": "",
                "deliveryMessage": "",
            },
            "paymentMethod": "card",
            "discountAmount": 0,
        }
        
        response = client.post("/orders", json=order_data)
        
        assert response.status_code == 400


class TestCancelOrder:
    """주문 취소 테스트"""
    
    def test_cancel_order_success(
        self,
        authenticated_client: tuple,
        db: Session,
        product_with_stock: models.Product,
    ):
        """정상 주문 취소 및 재고 복구"""
        client, user = authenticated_client
        
        # 주문 생성
        order_data = {
            "items": [
                {
                    "productId": product_with_stock.id,
                    "quantity": 2,
                    "color": "Black",
                    "size": "M",
                }
            ],
            "shippingAddress": {
                "recipientName": "홍길동",
                "phone": "010-1234-5678",
                "postalCode": "12345",
                "address": "서울시 강남구",
                "addressDetail": "",
                "deliveryMessage": "",
            },
            "paymentMethod": "card",
            "discountAmount": 0,
        }
        
        response = client.post("/orders", json=order_data)
        order_id = response.json()["orderId"]
        
        # 재고 확인 (주문 후)
        db.refresh(product_with_stock)
        assert product_with_stock.stock_quantity == 8
        
        # 주문 취소
        response = client.put(f"/orders/{order_id}/cancel", json={"reason": "단순 변심"})
        
        assert response.status_code == 200
        
        # 재고 복구 확인
        db.refresh(product_with_stock)
        assert product_with_stock.stock_quantity == 10

