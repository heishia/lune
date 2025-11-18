from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.security import get_current_user_id

from . import schemas, service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=schemas.AuthResponse)
def signup(payload: schemas.SignupRequest, db: Session = Depends(get_db)) -> schemas.AuthResponse:
    user = service.create_user(
        db=db,
        email=payload.email,
        password=payload.password,
        name=payload.name,
        phone=payload.phone,
        marketing_agreed=payload.marketing_agreed,
    )
    token = service.create_user_token(user)
    return schemas.AuthResponse(
        user=schemas.AuthUser(id=str(user.id), email=user.email, name=user.name),
        token=token,
    )


@router.post("/login", response_model=schemas.AuthResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)) -> schemas.AuthResponse:
    user = service.authenticate_user(db, email=payload.email, password=payload.password)
    token = service.create_user_token(user)
    return schemas.AuthResponse(
        user=schemas.AuthUser(id=str(user.id), email=user.email, name=user.name),
        token=token,
    )


@router.get("/me", response_model=schemas.MeResponse)
def get_me(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)) -> schemas.MeResponse:
    user = service.get_user_by_id(db, user_id=user_id)
    return schemas.MeResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        phone=user.phone,
        marketing_agreed=user.marketing_agreed,
    )


