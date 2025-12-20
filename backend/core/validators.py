"""입력 검증 유틸리티

XSS 방지 및 입력 데이터 검증을 위한 유틸리티를 제공합니다.
"""
import re
from typing import Any, Callable

import bleach
from pydantic import GetCoreSchemaHandler
from pydantic_core import CoreSchema, core_schema


def sanitize_html(value: str, allow_tags: list[str] | None = None) -> str:
    """HTML 태그 제거/정화
    
    Args:
        value: 정화할 문자열
        allow_tags: 허용할 태그 목록 (None이면 모든 태그 제거)
    
    Returns:
        정화된 문자열
    """
    if allow_tags is None:
        # 모든 HTML 태그 제거
        return bleach.clean(value, tags=[], strip=True)
    
    # 특정 태그만 허용
    return bleach.clean(value, tags=allow_tags, strip=True)


def sanitize_rich_text(value: str) -> str:
    """리치 텍스트 정화 (기본 포맷팅만 허용)
    
    허용 태그: b, i, u, p, br, ul, ol, li, strong, em
    """
    allowed_tags = [
        "b", "i", "u", "p", "br", "ul", "ol", "li",
        "strong", "em", "span", "a", "h1", "h2", "h3",
    ]
    allowed_attrs = {
        "a": ["href", "title"],
        "span": ["class"],
    }
    return bleach.clean(
        value,
        tags=allowed_tags,
        attributes=allowed_attrs,
        strip=True,
    )


def escape_for_sql_like(value: str) -> str:
    """SQL LIKE 패턴에서 특수문자 이스케이프
    
    %, _, \ 문자를 이스케이프합니다.
    """
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def validate_phone_number(value: str) -> str:
    """전화번호 형식 검증 및 정규화
    
    Args:
        value: 전화번호 문자열
    
    Returns:
        정규화된 전화번호 (숫자와 하이픈만 포함)
    
    Raises:
        ValueError: 잘못된 형식
    """
    # 숫자와 하이픈만 추출
    cleaned = re.sub(r"[^\d-]", "", value)
    
    # 하이픈 제거 후 숫자만 확인
    digits_only = cleaned.replace("-", "")
    
    if len(digits_only) < 9 or len(digits_only) > 11:
        raise ValueError("유효하지 않은 전화번호입니다.")
    
    # 형식 정규화 (010-1234-5678)
    if len(digits_only) == 11:
        return f"{digits_only[:3]}-{digits_only[3:7]}-{digits_only[7:]}"
    elif len(digits_only) == 10:
        return f"{digits_only[:3]}-{digits_only[3:6]}-{digits_only[6:]}"
    else:
        return cleaned


def validate_postal_code(value: str) -> str:
    """우편번호 형식 검증
    
    Args:
        value: 우편번호 문자열
    
    Returns:
        정규화된 우편번호
    
    Raises:
        ValueError: 잘못된 형식
    """
    # 숫자만 추출
    digits_only = re.sub(r"\D", "", value)
    
    if len(digits_only) != 5:
        raise ValueError("유효하지 않은 우편번호입니다.")
    
    return digits_only


class SanitizedString(str):
    """HTML이 제거된 안전한 문자열 타입
    
    Pydantic 모델에서 사용:
        class MyModel(BaseModel):
            name: SanitizedString
    """
    
    @classmethod
    def __get_pydantic_core_schema__(
        cls,
        source_type: Any,
        handler: GetCoreSchemaHandler,
    ) -> CoreSchema:
        return core_schema.no_info_after_validator_function(
            cls.validate,
            core_schema.str_schema(),
        )
    
    @classmethod
    def validate(cls, value: str) -> "SanitizedString":
        if not isinstance(value, str):
            raise ValueError("문자열이어야 합니다.")
        return cls(sanitize_html(value))


class RichTextString(str):
    """기본 포맷팅이 허용된 리치 텍스트 타입"""
    
    @classmethod
    def __get_pydantic_core_schema__(
        cls,
        source_type: Any,
        handler: GetCoreSchemaHandler,
    ) -> CoreSchema:
        return core_schema.no_info_after_validator_function(
            cls.validate,
            core_schema.str_schema(),
        )
    
    @classmethod
    def validate(cls, value: str) -> "RichTextString":
        if not isinstance(value, str):
            raise ValueError("문자열이어야 합니다.")
        return cls(sanitize_rich_text(value))


# 비밀번호 검증 규칙
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128


def validate_password_strength(password: str) -> str:
    """비밀번호 강도 검증
    
    Args:
        password: 비밀번호
    
    Returns:
        검증된 비밀번호
    
    Raises:
        ValueError: 요구사항 미충족
    """
    if len(password) < PASSWORD_MIN_LENGTH:
        raise ValueError(f"비밀번호는 {PASSWORD_MIN_LENGTH}자 이상이어야 합니다.")
    
    if len(password) > PASSWORD_MAX_LENGTH:
        raise ValueError(f"비밀번호는 {PASSWORD_MAX_LENGTH}자를 초과할 수 없습니다.")
    
    # 최소 요구사항: 영문 + 숫자
    if not re.search(r"[a-zA-Z]", password):
        raise ValueError("비밀번호에 영문자가 포함되어야 합니다.")
    
    if not re.search(r"\d", password):
        raise ValueError("비밀번호에 숫자가 포함되어야 합니다.")
    
    return password


def validate_email(email: str) -> str:
    """이메일 형식 검증
    
    Args:
        email: 이메일 주소
    
    Returns:
        소문자로 정규화된 이메일
    
    Raises:
        ValueError: 잘못된 형식
    """
    email = email.strip().lower()
    
    # 기본 형식 검사
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(email_pattern, email):
        raise ValueError("유효하지 않은 이메일 형식입니다.")
    
    return email

