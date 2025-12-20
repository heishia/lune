"""이메일 관련 비동기 태스크"""
from . import celery_app
from backend.core.logger import get_logger

logger = get_logger(__name__)


@celery_app.task(bind=True, max_retries=3)
def send_email_async(
    self,
    to: str,
    subject: str,
    body: str,
    html: bool = False,
):
    """비동기 이메일 발송
    
    Args:
        to: 수신자 이메일
        subject: 제목
        body: 본문
        html: HTML 형식 여부
    """
    try:
        # TODO: 실제 이메일 발송 로직 (SMTP, SendGrid 등)
        logger.info("Email sent to %s: %s", to, subject)
        return {"success": True, "to": to}
    except Exception as e:
        logger.error("Email send failed: %s", str(e))
        # 재시도
        self.retry(exc=e, countdown=60 * (self.request.retries + 1))


@celery_app.task
def send_order_confirmation_email(order_id: str, user_email: str):
    """주문 확인 이메일 발송"""
    logger.info("Sending order confirmation for %s to %s", order_id, user_email)
    # TODO: 주문 정보 조회 및 이메일 템플릿 생성
    return send_email_async.delay(
        to=user_email,
        subject=f"[LUNE] 주문이 완료되었습니다 ({order_id})",
        body=f"주문번호 {order_id}의 주문이 완료되었습니다.",
    )


@celery_app.task
def send_shipping_notification_email(order_id: str, user_email: str, tracking_number: str):
    """배송 시작 알림 이메일 발송"""
    logger.info("Sending shipping notification for %s to %s", order_id, user_email)
    return send_email_async.delay(
        to=user_email,
        subject=f"[LUNE] 상품이 발송되었습니다 ({order_id})",
        body=f"주문번호 {order_id}의 상품이 발송되었습니다. 운송장번호: {tracking_number}",
    )

