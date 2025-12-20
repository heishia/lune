"""분석/통계 관련 비동기 태스크"""
from datetime import datetime

from . import celery_app
from backend.core.logger import get_logger

logger = get_logger(__name__)


@celery_app.task
def increment_product_view_count(product_id: int):
    """상품 조회수 증가 (비동기)
    
    실시간 조회수 업데이트 대신 배치로 처리하여 DB 부하 감소
    """
    from backend.core.database import SessionLocal
    from backend.core import models
    
    db = SessionLocal()
    try:
        product = db.query(models.Product).filter(models.Product.id == product_id).first()
        if product:
            product.view_count += 1
            db.commit()
            logger.debug("Product %d view count incremented", product_id)
    except Exception as e:
        logger.error("Failed to increment view count: %s", str(e))
        db.rollback()
    finally:
        db.close()


@celery_app.task
def update_product_statistics():
    """상품 통계 업데이트 (주기적 배치)"""
    logger.info("Starting product statistics update")
    # TODO: 상품별 판매량, 리뷰 통계 등 집계
    pass


@celery_app.task
def cleanup_expired_carts():
    """만료된 장바구니 정리 (일일 배치)"""
    from datetime import timedelta
    from backend.core.database import SessionLocal
    from backend.core import models
    
    db = SessionLocal()
    try:
        # 30일 이상 된 장바구니 삭제
        cutoff = datetime.utcnow() - timedelta(days=30)
        deleted = db.query(models.Cart).filter(
            models.Cart.updated_at < cutoff
        ).delete()
        db.commit()
        logger.info("Cleaned up %d expired cart items", deleted)
        return {"deleted": deleted}
    except Exception as e:
        logger.error("Failed to cleanup carts: %s", str(e))
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()

