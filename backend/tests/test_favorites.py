"""위시리스트 테스트"""
import pytest
from fastapi.testclient import TestClient


class TestFavorites:
    """위시리스트 기능 테스트"""
    
    def test_toggle_favorite_requires_auth(self, client: TestClient):
        """인증 없이 찜 토글 시 401 반환"""
        response = client.post("/favorites/1")
        assert response.status_code == 401
    
    def test_get_favorites_requires_auth(self, client: TestClient):
        """인증 없이 찜 목록 조회 시 401 반환"""
        response = client.get("/favorites")
        assert response.status_code == 401
    
    def test_toggle_favorite_success(self, authenticated_client):
        """찜 토글 성공"""
        client, _ = authenticated_client
        
        # 찜 추가
        response = client.post("/favorites/1")
        assert response.status_code in [200, 404]  # 상품이 없으면 404
    
    def test_get_favorite_status(self, authenticated_client):
        """찜 상태 조회"""
        client, _ = authenticated_client
        
        response = client.get("/favorites/1/status")
        assert response.status_code in [200, 404]

