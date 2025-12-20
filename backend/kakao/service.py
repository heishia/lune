from typing import Optional
from datetime import datetime
from uuid import uuid4
import json
import httpx
from sqlalchemy.orm import Session

from backend.core import models
from backend.core.config import get_settings
from backend.core.exceptions import NotFoundError, UnauthorizedError
from backend.core.security import create_access_token, create_refresh_token

# 카카오톡 설정의 고정 ID
KAKAO_SETTINGS_ID = "00000000-0000-0000-0000-000000000000"


def get_kakao_settings(db: Session) -> models.KakaoSettings:
    """카카오톡 설정을 조회합니다. 없으면 생성합니다."""
    settings = db.query(models.KakaoSettings).filter(
        models.KakaoSettings.id == KAKAO_SETTINGS_ID
    ).first()
    
    if not settings:
        settings = models.KakaoSettings(
            id=KAKAO_SETTINGS_ID,
            access_token="",
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return settings


def update_kakao_settings(db: Session, access_token: str) -> models.KakaoSettings:
    """카카오톡 액세스 토큰을 업데이트합니다."""
    settings = get_kakao_settings(db)
    settings.access_token = access_token
    db.commit()
    db.refresh(settings)
    return settings


async def get_kakao_token_from_code(
    code: str,
    redirect_uri: str,
) -> dict:
    """
    인가 코드로 카카오톡 액세스 토큰을 발급받습니다.
    
    Args:
        code: 인가 코드
        redirect_uri: 리다이렉트 URI
        
    Returns:
        토큰 정보 (access_token, refresh_token 등)
    """
    app_settings = get_settings()
    rest_api_key = app_settings.kakao_rest_api_key
    client_secret = app_settings.kakao_client_secret
    
    if not rest_api_key:
        raise ValueError("카카오톡 REST API 키가 설정되지 않았습니다.")
    
    if not redirect_uri:
        raise ValueError("카카오톡 리다이렉트 URI가 설정되지 않았습니다.")
    
    token_url = "https://kauth.kakao.com/oauth/token"
    
    data = {
        "grant_type": "authorization_code",
        "client_id": rest_api_key,
        "redirect_uri": redirect_uri,
        "code": code,
    }
    
    # Client Secret이 설정되어 있으면 포함
    if client_secret:
        data["client_secret"] = client_secret
    
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(token_url, headers=headers, data=data)
        
        if response.status_code == 200:
            return response.json()
        else:
            error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
            error_msg = error_data.get("error_description", error_data.get("error", f"HTTP {response.status_code}"))
            error_code = error_data.get("error", response.status_code)
            raise ValueError(f"토큰 발급 실패: {error_code} - {error_msg}")


def get_kakao_auth_url(redirect_uri: str, for_login: bool = False) -> str:
    """
    카카오톡 인가 코드 요청 URL을 생성합니다.
    
    Args:
        redirect_uri: 리다이렉트 URI
        for_login: 로그인용이면 True (이메일 스코프 포함)
        
    Returns:
        인가 코드 요청 URL
    """
    app_settings = get_settings()
    rest_api_key = app_settings.kakao_rest_api_key
    
    if not rest_api_key:
        raise ValueError("카카오톡 REST API 키가 설정되지 않았습니다.")
    
    # 로그인용 스코프: 이메일, 프로필
    if for_login:
        scopes = ["account_email", "profile_nickname"]
    else:
        # 메시지 전송용 스코프
        scopes = ["friends", "talk_message"]
    
    auth_url = (
        f"https://kauth.kakao.com/oauth/authorize"
        f"?client_id={rest_api_key}"
        f"&redirect_uri={redirect_uri}"
        f"&response_type=code"
        f"&scope={' '.join(scopes)}"
    )
    
    return auth_url


async def get_kakao_user_info(access_token: str) -> dict:
    """
    카카오 액세스 토큰으로 사용자 정보를 조회합니다.
    
    Returns:
        사용자 정보 (id, email, nickname 등)
    """
    api_url = "https://kapi.kakao.com/v2/user/me"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(api_url, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
            error_msg = error_data.get("msg", f"HTTP {response.status_code}")
            raise UnauthorizedError(f"카카오 사용자 정보 조회 실패: {error_msg}")


async def kakao_login(db: Session, code: str, redirect_uri: str) -> tuple[models.User, str, str]:
    """
    카카오 로그인 처리
    
    Args:
        db: 데이터베이스 세션
        code: 카카오 인가 코드
        redirect_uri: 리다이렉트 URI
        
    Returns:
        (user, access_token, refresh_token)
    """
    # 1. 인가 코드로 카카오 토큰 발급
    token_data = await get_kakao_token_from_code(code, redirect_uri)
    kakao_access_token = token_data.get("access_token")
    
    if not kakao_access_token:
        raise UnauthorizedError("카카오 토큰 발급에 실패했습니다.")
    
    # 2. 카카오 사용자 정보 조회
    kakao_user = await get_kakao_user_info(kakao_access_token)
    
    kakao_id = str(kakao_user.get("id"))
    kakao_account = kakao_user.get("kakao_account", {})
    profile = kakao_account.get("profile", {})
    
    email = kakao_account.get("email", f"kakao_{kakao_id}@kakao.local")
    name = profile.get("nickname", f"카카오사용자{kakao_id[:4]}")
    
    # 3. 기존 사용자 확인 또는 생성
    # 먼저 이메일로 검색
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        # 새 사용자 생성 (소셜 로그인 사용자)
        user = models.User(
            id=str(uuid4()),
            email=email,
            name=name,
            password_hash="",  # 소셜 로그인은 비밀번호 없음
            phone="",  # 나중에 프로필에서 입력
            marketing_agreed=False,
            is_active=True,
            is_admin=False,
            points=0,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # 기존 사용자 마지막 로그인 시간 업데이트
        user.last_login = datetime.utcnow()
        db.commit()
        db.refresh(user)
    
    # 4. JWT 토큰 생성
    access_token = create_access_token(
        subject=str(user.id),
        extra_claims={
            "email": user.email,
            "name": user.name,
            "is_admin": user.is_admin,
        },
    )
    refresh_token = create_refresh_token(subject=str(user.id))
    
    return user, access_token, refresh_token


def get_marketing_users(db: Session) -> list[models.User]:
    """마케팅 동의한 사용자 목록을 조회합니다."""
    return db.query(models.User).filter(
        models.User.marketing_agreed == True,
        models.User.is_active == True
    ).all()


async def get_kakao_friends(access_token: str) -> list[dict]:
    """
    카카오톡 친구 목록을 조회합니다.
    
    Returns:
        친구 목록 (각 친구는 uuid, profile_nickname 등을 포함)
    """
    api_url = "https://kapi.kakao.com/v1/api/talk/friends"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(api_url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                return data.get("elements", [])
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
                error_msg = error_data.get("msg", f"HTTP {response.status_code}")
                error_code = error_data.get("code", response.status_code)
                raise ValueError(f"친구 목록 조회 실패: {error_code} - {error_msg}")
    except httpx.HTTPStatusError as e:
        error_data = e.response.json() if e.response.headers.get("content-type", "").startswith("application/json") else {}
        error_msg = error_data.get("msg", str(e))
        error_code = error_data.get("code", e.response.status_code)
        raise ValueError(f"친구 목록 조회 실패: {error_code} - {error_msg}")


async def send_kakao_message(
    db: Session,
    message: str,
) -> tuple[int, int]:
    """
    카카오톡 메시지를 전송합니다.
    
    참고: 카카오톡 친구 메시지 API를 사용합니다.
    사용자가 카카오톡 친구로 등록되어 있어야 메시지 전송이 가능합니다.
    
    Returns:
        (sent_count, failed_count): 전송 성공 수와 실패 수
    """
    kakao_settings = get_kakao_settings(db)
    
    if not kakao_settings.access_token:
        raise ValueError("카카오톡 액세스 토큰이 설정되지 않았습니다.")
    
    users = get_marketing_users(db)
    
    if not users:
        return 0, 0
    
    # 친구 목록 조회
    try:
        friends = await get_kakao_friends(kakao_settings.access_token)
        # 친구 UUID를 키로 하는 딕셔너리 생성 (이메일이나 전화번호로 매칭 시 사용)
        friends_by_uuid = {friend.get("uuid"): friend for friend in friends}
    except Exception as e:
        print(f"친구 목록 조회 실패: {e}")
        # 친구 목록 조회 실패 시 빈 리스트로 처리
        friends_by_uuid = {}
    
    sent_count = 0
    failed_count = 0
    
    # 카카오톡 친구 메시지 API 엔드포인트
    # 기본 템플릿으로 메시지 발송
    api_url = "https://kapi.kakao.com/v1/api/talk/friends/message/default/send"
    
    headers = {
        "Authorization": f"Bearer {kakao_settings.access_token}",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    
    # 전송할 친구 UUID 목록 수집
    receiver_uuids = []
    for user in users:
        # 실제로는 사용자 정보(이메일, 전화번호 등)와 친구 정보를 매칭해야 함
        # 여기서는 친구 목록의 모든 친구에게 전송하는 예시
        # 실제 구현 시에는 사용자 정보와 친구 정보를 매칭하는 로직 필요
        pass
    
    # 친구 목록이 있으면 모든 친구에게 전송
    # 실제로는 마케팅 동의 사용자와 친구를 매칭해야 함
    if friends_by_uuid:
        receiver_uuids = list(friends_by_uuid.keys())
    else:
        # 친구 목록이 없으면 전송할 수 없음
        return 0, len(users)
    
    if not receiver_uuids:
        return 0, len(users)
    
    # 기본 템플릿 메시지 형식
    template_object = {
        "object_type": "text",
        "text": message,
        "link": {
            "web_url": "https://lune.com",
            "mobile_web_url": "https://lune.com",
        },
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # 카카오톡 친구 메시지 API 요청 형식
            # receiver_uuids: 친구의 카카오톡 UUID 배열 (JSON 문자열)
            # template_object: 메시지 템플릿 객체 (JSON 문자열)
            
            data = {
                "receiver_uuids": json.dumps(receiver_uuids),
                "template_object": json.dumps(template_object),
            }
            
            response = await client.post(api_url, headers=headers, data=data)
            
            if response.status_code == 200:
                # 성공 시 응답에서 결과 확인
                result = response.json()
                sent_count = len(receiver_uuids)
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
                error_msg = error_data.get("msg", f"HTTP {response.status_code}")
                error_code = error_data.get("code", response.status_code)
                raise ValueError(f"메시지 전송 실패: {error_code} - {error_msg}")
            
        except httpx.HTTPStatusError as e:
            error_data = e.response.json() if e.response.headers.get("content-type", "").startswith("application/json") else {}
            error_msg = error_data.get("msg", str(e))
            error_code = error_data.get("code", e.response.status_code)
            print(f"HTTP error sending message: {error_code} - {error_msg}")
            failed_count = len(receiver_uuids)
        except Exception as e:
            print(f"Failed to send message: {e}")
            failed_count = len(receiver_uuids)
    
    return sent_count, failed_count

