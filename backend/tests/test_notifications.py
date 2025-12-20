"""알림 테스트"""
import pytest
from fastapi.testclient import TestClient


class TestNotifications:
    """알림 기능 테스트"""
    
    def test_get_notifications_requires_auth(self, client: TestClient):
        """인증 없이 알림 조회 시 401 반환"""
        response = client.get("/notifications")
        assert response.status_code == 401
    
    def test_get_notifications_success(self, authenticated_client):
        """알림 목록 조회 성공"""
        client, _ = authenticated_client
        
        response = client.get("/notifications")
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "total" in data
        assert "unread_count" in data
    
    def test_mark_all_as_read(self, authenticated_client):
        """모든 알림 읽음 처리"""
        client, _ = authenticated_client
        
        response = client.post("/notifications/read-all")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

