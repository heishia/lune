"""Pytest 설정 및 공유 픽스처

테스트용 데이터베이스 설정과 공통 픽스처를 정의합니다.
"""
import os
import pytest
from typing import Generator
from uuid import uuid4

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from fastapi.testclient import TestClient

# 테스트 환경 설정 (실제 DB 연결 전에 설정)
os.environ["ENV"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["JWT_SECRET"] = "test-secret-key-for-testing-only"

from backend.core.models import Base
from backend.core.database import get_db
from backend.main import app


# 테스트용 SQLite 데이터베이스 엔진
TEST_DATABASE_URL = "sqlite:///./test.db"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite 전용
)

TestSessionLocal = sessionmaker(
    bind=test_engine,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """테스트용 데이터베이스 세션
    
    각 테스트 함수마다 새로운 테이블을 생성하고 테스트 후 삭제합니다.
    """
    # 테이블 생성
    Base.metadata.create_all(bind=test_engine)
    
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # 테이블 삭제
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """FastAPI TestClient
    
    데이터베이스 의존성을 테스트용 세션으로 오버라이드합니다.
    """
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data() -> dict:
    """테스트 사용자 데이터"""
    return {
        "email": f"test_{uuid4().hex[:8]}@example.com",
        "password": "testpassword123",
        "name": "테스트 사용자",
        "phone": "010-1234-5678",
        "marketing_agreed": False,
    }


@pytest.fixture
def test_product_data() -> dict:
    """테스트 상품 데이터"""
    return {
        "name": "테스트 상품",
        "description": "테스트 상품 설명입니다.",
        "price": 50000,
        "original_price": 60000,
        "category": ["BEST", "NEW"],
        "colors": ["Black", "White"],
        "sizes": ["S", "M", "L"],
        "image_url": "https://example.com/image.jpg",
        "images": ["https://example.com/image1.jpg"],
        "stock_quantity": 100,
        "is_new": True,
        "is_best": True,
        "is_active": True,
    }


@pytest.fixture
def authenticated_client(client: TestClient, test_user_data: dict) -> tuple[TestClient, dict]:
    """인증된 클라이언트와 사용자 정보
    
    회원가입 후 토큰이 포함된 클라이언트를 반환합니다.
    """
    # 회원가입
    response = client.post("/auth/signup", json=test_user_data)
    assert response.status_code == 200
    
    data = response.json()
    token = data["token"]
    user = data["user"]
    
    # 인증 헤더 설정
    client.headers["Authorization"] = f"Bearer {token}"
    
    return client, user

