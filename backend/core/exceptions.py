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


