from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str
    phone: str
    marketing_agreed: bool = False


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthUser(BaseModel):
    id: str
    email: EmailStr
    name: str
    is_admin: bool = False


class AuthResponse(BaseModel):
    success: bool = True
    user: AuthUser
    token: str
    refresh_token: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RefreshTokenResponse(BaseModel):
    success: bool = True
    token: str
    refresh_token: str


class MeResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    phone: str
    marketing_agreed: bool


# 이메일 인증 관련 스키마
class VerifyEmailRequest(BaseModel):
    token: str


class VerifyEmailResponse(BaseModel):
    success: bool = True
    message: str = "이메일이 인증되었습니다."


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ResendVerificationResponse(BaseModel):
    success: bool = True
    message: str = "인증 이메일이 발송되었습니다."


# 비밀번호 재설정 관련 스키마
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    success: bool = True
    message: str = "비밀번호 재설정 이메일이 발송되었습니다."


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class ResetPasswordResponse(BaseModel):
    success: bool = True
    message: str = "비밀번호가 변경되었습니다."


