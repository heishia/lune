from pydantic import BaseModel


class KakaoSettingsResponse(BaseModel):
    access_token: str
    has_token: bool
    auth_url: str = ""


class KakaoSettingsUpdate(BaseModel):
    access_token: str


class KakaoAuthCodeRequest(BaseModel):
    code: str
    state: str = ""


class KakaoTokenResponse(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str = ""
    expires_in: int
    scope: str = ""


class MarketingUser(BaseModel):
    id: str
    email: str
    name: str
    phone: str
    marketing_agreed: bool
    created_at: str


class MarketingUsersResponse(BaseModel):
    users: list[MarketingUser]
    total: int


class SendMessageRequest(BaseModel):
    message: str


class SendMessageResponse(BaseModel):
    success: bool
    sent_count: int
    failed_count: int
    message: str


# 카카오 소셜 로그인 관련 스키마
class KakaoLoginRequest(BaseModel):
    """카카오 로그인 요청"""
    code: str
    redirect_uri: str


class KakaoLoginResponse(BaseModel):
    """카카오 로그인 응답"""
    success: bool = True
    user: "KakaoUserInfo"
    token: str
    refresh_token: str


class KakaoUserInfo(BaseModel):
    """카카오 사용자 정보"""
    id: str
    email: str
    name: str
    is_admin: bool = False


class KakaoAuthUrlResponse(BaseModel):
    """카카오 인가 URL 응답"""
    auth_url: str
