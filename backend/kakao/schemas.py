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

