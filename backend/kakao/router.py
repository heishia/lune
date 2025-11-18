from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import get_current_user_id

from . import schemas, service

router = APIRouter(prefix="/kakao", tags=["kakao"])


@router.get("/settings", response_model=schemas.KakaoSettingsResponse)
def get_settings(db: Session = Depends(get_db)) -> schemas.KakaoSettingsResponse:
    """카카오톡 설정을 조회합니다."""
    from backend.core.config import get_settings as get_app_settings
    app_settings = get_app_settings()
    
    kakao_settings = service.get_kakao_settings(db)
    has_token = bool(kakao_settings.access_token)
    
    # 토큰이 없으면 인가 URL 생성
    auth_url = ""
    if not has_token and app_settings.kakao_redirect_uri:
        try:
            auth_url = service.get_kakao_auth_url(app_settings.kakao_redirect_uri)
        except Exception:
            pass
    
    return schemas.KakaoSettingsResponse(
        access_token=kakao_settings.access_token if kakao_settings.access_token else "",
        has_token=has_token,
        auth_url=auth_url,
    )


@router.put("/settings", response_model=schemas.KakaoSettingsResponse)
def update_settings(
    payload: schemas.KakaoSettingsUpdate,
    db: Session = Depends(get_db),
) -> schemas.KakaoSettingsResponse:
    """카카오톡 액세스 토큰을 수동으로 업데이트합니다."""
    settings = service.update_kakao_settings(db, payload.access_token)
    return schemas.KakaoSettingsResponse(
        access_token=settings.access_token,
        has_token=bool(settings.access_token),
        auth_url="",
    )


@router.post("/auth/callback", response_model=schemas.KakaoTokenResponse)
async def kakao_auth_callback(
    payload: schemas.KakaoAuthCodeRequest,
    db: Session = Depends(get_db),
) -> schemas.KakaoTokenResponse:
    """카카오톡 OAuth 인가 코드를 받아 토큰을 발급받고 저장합니다."""
    from backend.core.config import get_settings as get_app_settings
    app_settings = get_app_settings()
    
    if not app_settings.kakao_redirect_uri:
        raise ValueError("카카오톡 리다이렉트 URI가 설정되지 않았습니다.")
    
    # 인가 코드로 토큰 발급
    token_data = await service.get_kakao_token_from_code(
        code=payload.code,
        redirect_uri=app_settings.kakao_redirect_uri,
    )
    
    # 액세스 토큰 저장
    service.update_kakao_settings(db, token_data.get("access_token", ""))
    
    return schemas.KakaoTokenResponse(
        access_token=token_data.get("access_token", ""),
        token_type=token_data.get("token_type", "bearer"),
        refresh_token=token_data.get("refresh_token", ""),
        expires_in=token_data.get("expires_in", 0),
        scope=token_data.get("scope", ""),
    )


@router.get("/users", response_model=schemas.MarketingUsersResponse)
def get_marketing_users(db: Session = Depends(get_db)) -> schemas.MarketingUsersResponse:
    """마케팅 동의한 사용자 목록을 조회합니다."""
    users = service.get_marketing_users(db)
    return schemas.MarketingUsersResponse(
        users=[
            schemas.MarketingUser(
                id=str(user.id),
                email=user.email,
                name=user.name,
                phone=user.phone,
                marketing_agreed=user.marketing_agreed,
                created_at=user.created_at.isoformat() if user.created_at else "",
            )
            for user in users
        ],
        total=len(users),
    )


@router.post("/send", response_model=schemas.SendMessageResponse)
async def send_message(
    payload: schemas.SendMessageRequest,
    db: Session = Depends(get_db),
) -> schemas.SendMessageResponse:
    """카카오톡 메시지를 전송합니다."""
    try:
        sent_count, failed_count = await service.send_kakao_message(db, payload.message)
        return schemas.SendMessageResponse(
            success=True,
            sent_count=sent_count,
            failed_count=failed_count,
            message=f"메시지 전송 완료: 성공 {sent_count}건, 실패 {failed_count}건",
        )
    except ValueError as e:
        return schemas.SendMessageResponse(
            success=False,
            sent_count=0,
            failed_count=0,
            message=str(e),
        )
    except Exception as e:
        return schemas.SendMessageResponse(
            success=False,
            sent_count=0,
            failed_count=0,
            message=f"메시지 전송 중 오류가 발생했습니다: {str(e)}",
        )

