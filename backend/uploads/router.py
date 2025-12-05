import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from pydantic import BaseModel
import httpx

from backend.core.config import get_settings
from backend.core.security import get_current_user_id
from backend.core.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

router = APIRouter(prefix="/uploads", tags=["uploads"])

# 허용된 파일 확장자
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".avi"}

# Supabase Storage 버킷 이름
IMAGE_BUCKET = "content/images"
VIDEO_BUCKET = "content/videos"


class UploadResponse(BaseModel):
    url: str
    filename: str
    content_type: str
    size: int


def get_file_extension(filename: str) -> str:
    """파일 확장자 추출"""
    import os
    return os.path.splitext(filename)[1].lower()


async def upload_to_supabase(
    bucket: str,
    file_path: str,
    content: bytes,
    content_type: str
) -> str:
    """Supabase Storage에 파일 업로드"""
    if not settings.supabase_url or not settings.supabase_service_key:
        raise HTTPException(
            status_code=500,
            detail="Supabase Storage가 설정되지 않았습니다. SUPABASE_URL과 SUPABASE_SERVICE_KEY를 설정해주세요."
        )
    
    # Supabase Storage API URL
    storage_url = f"{settings.supabase_url}/storage/v1/object/{bucket}/{file_path}"
    
    headers = {
        "Authorization": f"Bearer {settings.supabase_service_key}",
        "Content-Type": content_type,
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            storage_url,
            content=content,
            headers=headers,
        )
        
        if response.status_code not in [200, 201]:
            logger.error(f"Supabase upload failed: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=500,
                detail=f"파일 업로드에 실패했습니다: {response.text}"
            )
    
    # Public URL 반환
    public_url = f"{settings.supabase_url}/storage/v1/object/public/{bucket}/{file_path}"
    return public_url


@router.post("/image", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    """이미지 파일 업로드 (Supabase Storage)"""
    
    # 파일 확장자 확인
    ext = get_file_extension(file.filename or "")
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"허용되지 않은 파일 형식입니다. 허용: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
        )
    
    # 파일 읽기
    content = await file.read()
    
    # 파일 크기 확인 (10MB 제한)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="파일 크기는 10MB를 초과할 수 없습니다.")
    
    # 고유 파일명 생성
    unique_filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = f"uploads/{user_id}/{unique_filename}"
    
    # Supabase Storage에 업로드
    public_url = await upload_to_supabase(
        IMAGE_BUCKET,
        file_path,
        content,
        file.content_type or "image/jpeg"
    )
    
    logger.info(f"Image uploaded: {unique_filename} by user {user_id}")
    
    return UploadResponse(
        url=public_url,
        filename=unique_filename,
        content_type=file.content_type or "image/jpeg",
        size=len(content),
    )


@router.post("/video", response_model=UploadResponse)
async def upload_video(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    """동영상 파일 업로드 (Supabase Storage)"""
    
    # 파일 확장자 확인
    ext = get_file_extension(file.filename or "")
    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"허용되지 않은 파일 형식입니다. 허용: {', '.join(ALLOWED_VIDEO_EXTENSIONS)}"
        )
    
    # 파일 읽기
    content = await file.read()
    
    # 파일 크기 확인 (100MB 제한)
    if len(content) > 100 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="파일 크기는 100MB를 초과할 수 없습니다.")
    
    # 고유 파일명 생성
    unique_filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = f"uploads/{user_id}/{unique_filename}"
    
    # Supabase Storage에 업로드
    public_url = await upload_to_supabase(
        VIDEO_BUCKET,
        file_path,
        content,
        file.content_type or "video/mp4"
    )
    
    logger.info(f"Video uploaded: {unique_filename} by user {user_id}")
    
    return UploadResponse(
        url=public_url,
        filename=unique_filename,
        content_type=file.content_type or "video/mp4",
        size=len(content),
    )
