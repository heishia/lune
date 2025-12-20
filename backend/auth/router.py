from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import get_current_user_id
from backend.core.rate_limit import limiter, RATE_LIMITS
from backend.core.config import get_settings
from backend.core.cookies import set_auth_cookies, clear_auth_cookies

from . import schemas, service

settings = get_settings()

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=schemas.AuthResponse)
@limiter.limit(RATE_LIMITS["auth_signup"])
def signup(
    request: Request,
    response: Response,
    payload: schemas.SignupRequest,
    db: Session = Depends(get_db),
) -> schemas.AuthResponse:
    """회원가입 - 액세스 토큰과 리프레시 토큰 발급
    
    토큰은 httpOnly 쿠키와 JSON 응답 모두로 제공됩니다.
    """
    user = service.create_user(
        db=db,
        email=payload.email,
        password=payload.password,
        name=payload.name,
        phone=payload.phone,
        marketing_agreed=payload.marketing_agreed,
    )
    access_token, refresh_token = service.create_user_tokens(user)
    
    # httpOnly 쿠키로 토큰 설정
    set_auth_cookies(response, access_token, refresh_token)
    
    return schemas.AuthResponse(
        user=schemas.AuthUser(id=str(user.id), email=user.email, name=user.name),
        token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/login", response_model=schemas.AuthResponse)
@limiter.limit(RATE_LIMITS["auth_login"])
def login(
    request: Request,
    response: Response,
    payload: schemas.LoginRequest,
    db: Session = Depends(get_db),
) -> schemas.AuthResponse:
    """로그인 - 액세스 토큰과 리프레시 토큰 발급
    
    토큰은 httpOnly 쿠키와 JSON 응답 모두로 제공됩니다.
    """
    user = service.authenticate_user(db, email=payload.email, password=payload.password)
    access_token, refresh_token = service.create_user_tokens(user)
    
    # httpOnly 쿠키로 토큰 설정
    set_auth_cookies(response, access_token, refresh_token)
    
    return schemas.AuthResponse(
        user=schemas.AuthUser(
            id=str(user.id),
            email=user.email,
            name=user.name,
            is_admin=getattr(user, 'is_admin', False),
        ),
        token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=schemas.RefreshTokenResponse)
def refresh_token(
    request: Request,
    response: Response,
    payload: schemas.RefreshTokenRequest,
    db: Session = Depends(get_db),
) -> schemas.RefreshTokenResponse:
    """리프레시 토큰으로 새 액세스 토큰 발급"""
    access_token, new_refresh_token = service.refresh_access_token(
        db=db,
        refresh_token=payload.refresh_token,
    )
    
    # 새 토큰을 쿠키로도 설정
    set_auth_cookies(response, access_token, new_refresh_token)
    
    return schemas.RefreshTokenResponse(
        token=access_token,
        refresh_token=new_refresh_token,
    )


@router.post("/logout")
def logout(response: Response) -> dict:
    """로그아웃 - 인증 쿠키 삭제"""
    clear_auth_cookies(response)
    return {"success": True, "message": "로그아웃되었습니다."}


@router.get("/me", response_model=schemas.MeResponse)
def get_me(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)) -> schemas.MeResponse:
    """현재 사용자 정보 조회"""
    user = service.get_user_by_id(db, user_id=user_id)
    return schemas.MeResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        phone=user.phone,
        marketing_agreed=user.marketing_agreed,
    )


# ==========================================
# 이메일 인증
# ==========================================

@router.post("/verify-email", response_model=schemas.VerifyEmailResponse)
def verify_email(
    payload: schemas.VerifyEmailRequest,
    db: Session = Depends(get_db),
) -> schemas.VerifyEmailResponse:
    """이메일 인증 토큰 검증"""
    from . import email_verification
    email_verification.verify_email_token(db, payload.token)
    return schemas.VerifyEmailResponse()


@router.post("/resend-verification", response_model=schemas.ResendVerificationResponse)
async def resend_verification(
    payload: schemas.ResendVerificationRequest,
    db: Session = Depends(get_db),
) -> schemas.ResendVerificationResponse:
    """인증 이메일 재발송"""
    from . import email_verification
    
    # 이메일로 사용자 조회
    user = service.get_user_by_email(db, email=payload.email)
    if not user:
        # 보안상 사용자 없어도 같은 응답
        return schemas.ResendVerificationResponse(message="이메일이 등록되어 있다면 인증 메일이 발송됩니다.")
    
    token, _ = email_verification.resend_verification_email(db, user.id)
    await email_verification.send_verification_email(payload.email, token)
    return schemas.ResendVerificationResponse()


# ==========================================
# 비밀번호 재설정
# ==========================================

@router.post("/forgot-password", response_model=schemas.ForgotPasswordResponse)
@limiter.limit(RATE_LIMITS["auth_password_reset"])
async def forgot_password(
    request: Request,
    payload: schemas.ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> schemas.ForgotPasswordResponse:
    """비밀번호 재설정 이메일 발송"""
    from . import password_reset
    
    try:
        token, _ = password_reset.create_password_reset(db, payload.email)
        await password_reset.send_password_reset_email(payload.email, token)
    except Exception:
        # 보안상 오류가 발생해도 같은 응답
        pass
    
    return schemas.ForgotPasswordResponse(
        message="이메일이 등록되어 있다면 비밀번호 재설정 메일이 발송됩니다."
    )


@router.post("/reset-password", response_model=schemas.ResetPasswordResponse)
@limiter.limit(RATE_LIMITS["auth_password_reset"])
def reset_password_endpoint(
    request: Request,
    payload: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> schemas.ResetPasswordResponse:
    """비밀번호 재설정"""
    from . import password_reset
    password_reset.reset_password(db, payload.token, payload.new_password)
    return schemas.ResetPasswordResponse()


