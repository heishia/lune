import os
import re
import uuid
from datetime import datetime
from typing import Optional

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

# 파일 시그니처 (매직 바이트) 정의
# 이미지 파일 시그니처
IMAGE_SIGNATURES = {
    b'\xff\xd8\xff': 'image/jpeg',           # JPEG
    b'\x89PNG\r\n\x1a\n': 'image/png',       # PNG
    b'GIF87a': 'image/gif',                   # GIF87a
    b'GIF89a': 'image/gif',                   # GIF89a
    b'RIFF': 'image/webp',                    # WebP (RIFF로 시작, 이후 WEBP 확인 필요)
}

# 비디오 파일 시그니처
VIDEO_SIGNATURES = {
    b'\x00\x00\x00\x1cftypisom': 'video/mp4',     # MP4 (isom)
    b'\x00\x00\x00\x18ftypmp42': 'video/mp4',     # MP4 (mp42)
    b'\x00\x00\x00\x20ftypisom': 'video/mp4',     # MP4 (isom variant)
    b'\x00\x00\x00': 'video/mp4',                  # MP4 generic (추가 검증 필요)
    b'\x1aE\xdf\xa3': 'video/webm',               # WebM
    b'\x00\x00\x00\x14ftypqt': 'video/quicktime', # MOV
    b'RIFF': 'video/avi',                          # AVI (RIFF로 시작)
}

# MIME type과 확장자 매핑
MIME_TO_EXTENSION = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/quicktime': ['.mov'],
    'video/avi': ['.avi'],
    'video/x-msvideo': ['.avi'],
}

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
    return os.path.splitext(filename)[1].lower()


def sanitize_filename(filename: str) -> str:
    """파일명에서 위험한 문자 제거"""
    # 경로 구분자 및 특수문자 제거
    filename = os.path.basename(filename)
    # 알파벳, 숫자, 하이픈, 언더스코어, 점만 허용
    filename = re.sub(r'[^\w\-.]', '_', filename)
    # 연속된 점 방지
    filename = re.sub(r'\.+', '.', filename)
    # 시작과 끝의 점 제거
    filename = filename.strip('.')
    return filename if filename else 'unnamed'


def detect_file_type(content: bytes, is_video: bool = False) -> Optional[str]:
    """파일 내용의 매직 바이트로 실제 파일 타입 감지"""
    signatures = VIDEO_SIGNATURES if is_video else IMAGE_SIGNATURES
    
    for signature, mime_type in signatures.items():
        if content.startswith(signature):
            # WebP 추가 검증 (RIFF....WEBP)
            if signature == b'RIFF' and not is_video:
                if len(content) >= 12 and content[8:12] == b'WEBP':
                    return 'image/webp'
                continue  # RIFF지만 WEBP가 아니면 스킵
            
            # AVI 추가 검증 (RIFF....AVI )
            if signature == b'RIFF' and is_video:
                if len(content) >= 12 and content[8:12] == b'AVI ':
                    return 'video/avi'
                continue
            
            # MP4 추가 검증 (ftyp 박스 확인)
            if signature == b'\x00\x00\x00' and is_video:
                # ftyp 박스 패턴 검색
                if b'ftyp' in content[:32]:
                    return 'video/mp4'
                continue
            
            return mime_type
    
    return None


def validate_file_content(content: bytes, extension: str, is_video: bool = False) -> tuple[bool, str]:
    """파일 내용과 확장자의 일치 여부 검증"""
    detected_type = detect_file_type(content, is_video)
    
    if detected_type is None:
        return False, "파일 형식을 인식할 수 없습니다. 손상된 파일이거나 지원되지 않는 형식입니다."
    
    # 감지된 MIME type에 해당하는 확장자 확인
    allowed_extensions = MIME_TO_EXTENSION.get(detected_type, [])
    
    if extension.lower() not in allowed_extensions:
        return False, f"파일 내용({detected_type})과 확장자({extension})가 일치하지 않습니다."
    
    return True, detected_type


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
    """이미지 파일 업로드 (Supabase Storage)
    
    보안 검증:
    - 파일 확장자 검사
    - 파일 크기 제한 (10MB)
    - 파일 내용 시그니처 검증 (매직 바이트)
    - 확장자와 파일 내용 일치 검증
    """
    
    # 파일명 sanitization
    safe_filename = sanitize_filename(file.filename or "unnamed")
    
    # 파일 확장자 확인
    ext = get_file_extension(safe_filename)
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
    
    # 최소 크기 검증 (빈 파일 방지)
    if len(content) < 8:
        raise HTTPException(status_code=400, detail="유효하지 않은 파일입니다.")
    
    # 파일 내용 검증 (매직 바이트로 실제 파일 타입 확인)
    is_valid, result = validate_file_content(content, ext, is_video=False)
    if not is_valid:
        raise HTTPException(status_code=400, detail=result)
    
    detected_mime_type = result
    
    # 고유 파일명 생성
    unique_filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = f"uploads/{user_id}/{unique_filename}"
    
    # Supabase Storage에 업로드
    public_url = await upload_to_supabase(
        IMAGE_BUCKET,
        file_path,
        content,
        detected_mime_type  # 감지된 MIME type 사용
    )
    
    logger.info(f"Image uploaded: {unique_filename} by user {user_id} (type: {detected_mime_type})")
    
    return UploadResponse(
        url=public_url,
        filename=unique_filename,
        content_type=detected_mime_type,
        size=len(content),
    )


@router.post("/video", response_model=UploadResponse)
async def upload_video(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    """동영상 파일 업로드 (Supabase Storage)
    
    보안 검증:
    - 파일 확장자 검사
    - 파일 크기 제한 (100MB)
    - 파일 내용 시그니처 검증 (매직 바이트)
    - 확장자와 파일 내용 일치 검증
    """
    
    # 파일명 sanitization
    safe_filename = sanitize_filename(file.filename or "unnamed")
    
    # 파일 확장자 확인
    ext = get_file_extension(safe_filename)
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
    
    # 최소 크기 검증 (빈 파일 방지)
    if len(content) < 8:
        raise HTTPException(status_code=400, detail="유효하지 않은 파일입니다.")
    
    # 파일 내용 검증 (매직 바이트로 실제 파일 타입 확인)
    is_valid, result = validate_file_content(content, ext, is_video=True)
    if not is_valid:
        raise HTTPException(status_code=400, detail=result)
    
    detected_mime_type = result
    
    # 고유 파일명 생성
    unique_filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = f"uploads/{user_id}/{unique_filename}"
    
    # Supabase Storage에 업로드
    public_url = await upload_to_supabase(
        VIDEO_BUCKET,
        file_path,
        content,
        detected_mime_type  # 감지된 MIME type 사용
    )
    
    logger.info(f"Video uploaded: {unique_filename} by user {user_id} (type: {detected_mime_type})")
    
    return UploadResponse(
        url=public_url,
        filename=unique_filename,
        content_type=detected_mime_type,
        size=len(content),
    )
