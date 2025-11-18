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


class MeResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    phone: str
    marketing_agreed: bool


