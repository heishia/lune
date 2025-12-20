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


# 카카오 소셜 로그인 관련 스키마 (카카오싱크)
class KakaoLoginRequest(BaseModel):
    """카카오 로그인 요청"""
    code: str
    redirect_uri: str


class KakaoUserInfo(BaseModel):
    """카카오 사용자 정보 (카카오싱크 동의항목 포함)"""
    id: str
    email: str
    name: str
    phone: str = ""
    postal_code: str = ""
    address: str = ""
    address_detail: str = ""
    is_admin: bool = False
    is_profile_complete: bool = False  # 필수 정보 입력 완료 여부


class KakaoLoginResponse(BaseModel):
    """카카오 로그인 응답"""
    success: bool = True
    user: KakaoUserInfo
    token: str
    refresh_token: str
    is_new_user: bool = False  # 신규 가입 여부


class KakaoAuthUrlResponse(BaseModel):
    """카카오 인가 URL 응답"""
    auth_url: str
