from fastapi import status


class DomainError(Exception):
    """도메인 로직에서 발생하는 일반적인 예외의 기본 클래스."""

    status_code: int = status.HTTP_400_BAD_REQUEST
    error_code: str = "domain_error"

    def __init__(self, message: str = "Domain error") -> None:
        self.message = message
        super().__init__(message)


class NotFoundError(DomainError):
    status_code = status.HTTP_404_NOT_FOUND
    error_code = "not_found"


class UnauthorizedError(DomainError):
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "unauthorized"


class ForbiddenError(DomainError):
    status_code = status.HTTP_403_FORBIDDEN
    error_code = "forbidden"


class ConflictError(DomainError):
    status_code = status.HTTP_409_CONFLICT
    error_code = "conflict"


class BadRequestError(DomainError):
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "bad_request"


class ValidationError(DomainError):
    """입력 데이터 유효성 검증 실패"""
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    error_code = "validation_error"


class InsufficientStockError(DomainError):
    """재고 부족"""
    status_code = status.HTTP_409_CONFLICT
    error_code = "insufficient_stock"


class PaymentError(DomainError):
    """결제 처리 오류"""
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    error_code = "payment_error"


class RateLimitError(DomainError):
    """요청 제한 초과"""
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    error_code = "rate_limit_exceeded"


class ServiceUnavailableError(DomainError):
    """외부 서비스 연결 실패"""
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    error_code = "service_unavailable"


class FileUploadError(DomainError):
    """파일 업로드 오류"""
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "file_upload_error"


class ExpiredTokenError(DomainError):
    """토큰 만료"""
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "token_expired"


class InvalidTokenError(DomainError):
    """유효하지 않은 토큰"""
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "invalid_token"


