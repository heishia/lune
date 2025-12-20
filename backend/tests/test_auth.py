"""인증 API 테스트"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


class TestSignup:
    """회원가입 테스트"""
    
    def test_signup_success(self, client: TestClient, test_user_data: dict):
        """정상 회원가입"""
        response = client.post("/auth/signup", json=test_user_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["user"]["email"] == test_user_data["email"]
        assert data["user"]["name"] == test_user_data["name"]
        assert "token" in data
        assert "refresh_token" in data
    
    def test_signup_duplicate_email(self, client: TestClient, test_user_data: dict):
        """중복 이메일 가입 시도"""
        # 첫 번째 가입
        response1 = client.post("/auth/signup", json=test_user_data)
        assert response1.status_code == 200
        
        # 같은 이메일로 두 번째 가입 시도
        response2 = client.post("/auth/signup", json=test_user_data)
        assert response2.status_code == 409
        assert "이미 존재하는 이메일" in response2.json()["error"]
    
    def test_signup_invalid_email(self, client: TestClient, test_user_data: dict):
        """잘못된 이메일 형식"""
        test_user_data["email"] = "invalid-email"
        response = client.post("/auth/signup", json=test_user_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_signup_short_password(self, client: TestClient, test_user_data: dict):
        """짧은 비밀번호"""
        test_user_data["password"] = "short"  # 8자 미만
        response = client.post("/auth/signup", json=test_user_data)
        
        assert response.status_code == 422


class TestLogin:
    """로그인 테스트"""
    
    def test_login_success(self, client: TestClient, test_user_data: dict):
        """정상 로그인"""
        # 먼저 회원가입
        client.post("/auth/signup", json=test_user_data)
        
        # 로그인
        response = client.post("/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "token" in data
        assert "refresh_token" in data
    
    def test_login_wrong_password(self, client: TestClient, test_user_data: dict):
        """잘못된 비밀번호"""
        # 먼저 회원가입
        client.post("/auth/signup", json=test_user_data)
        
        # 잘못된 비밀번호로 로그인
        response = client.post("/auth/login", json={
            "email": test_user_data["email"],
            "password": "wrongpassword",
        })
        
        assert response.status_code == 401
    
    def test_login_nonexistent_email(self, client: TestClient):
        """존재하지 않는 이메일"""
        response = client.post("/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "somepassword123",
        })
        
        assert response.status_code == 401


class TestRefreshToken:
    """토큰 갱신 테스트"""
    
    def test_refresh_token_success(self, client: TestClient, test_user_data: dict):
        """정상 토큰 갱신"""
        # 회원가입
        response = client.post("/auth/signup", json=test_user_data)
        refresh_token = response.json()["refresh_token"]
        
        # 토큰 갱신
        response = client.post("/auth/refresh", json={
            "refresh_token": refresh_token,
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "refresh_token" in data
    
    def test_refresh_token_invalid(self, client: TestClient):
        """유효하지 않은 리프레시 토큰"""
        response = client.post("/auth/refresh", json={
            "refresh_token": "invalid-refresh-token",
        })
        
        assert response.status_code == 401


class TestMe:
    """사용자 정보 조회 테스트"""
    
    def test_get_me_success(self, authenticated_client: tuple):
        """인증된 사용자 정보 조회"""
        client, user = authenticated_client
        
        response = client.get("/auth/me")
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == user["email"]
        assert data["name"] == user["name"]
    
    def test_get_me_unauthenticated(self, client: TestClient):
        """미인증 상태에서 정보 조회"""
        response = client.get("/auth/me")
        
        assert response.status_code == 403  # HTTPBearer 기본 동작

