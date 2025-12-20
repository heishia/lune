"""Celery 비동기 태스크 모듈

백그라운드 작업을 위한 Celery 설정과 태스크를 정의합니다.
"""
from celery import Celery

from backend.core.config import get_settings
from backend.core.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()

# Celery 앱 초기화
celery_app = Celery(
    "lune",
    broker=settings.effective_celery_broker,
    backend=settings.effective_celery_backend,
)

# Celery 설정
celery_app.conf.update(
    # 직렬화 설정
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    
    # 타임존 설정
    timezone="Asia/Seoul",
    enable_utc=True,
    
    # 태스크 설정
    task_track_started=True,
    task_time_limit=300,  # 5분 제한
    task_soft_time_limit=270,  # 4.5분 soft 제한
    
    # 결과 만료
    result_expires=3600,  # 1시간
    
    # 재시도 설정
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)

# 태스크 모듈 자동 발견
celery_app.autodiscover_tasks(["backend.tasks"])

logger.info("Celery 앱 초기화 완료")

