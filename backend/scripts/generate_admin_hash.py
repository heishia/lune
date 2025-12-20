#!/usr/bin/env python3
"""관리자 비밀번호 해시 생성 스크립트

사용법:
    python backend/scripts/generate_admin_hash.py <password>
    
예시:
    python backend/scripts/generate_admin_hash.py mySecurePassword123!
    
생성된 해시를 .env 파일의 ADMIN_PASSWORD_HASH에 설정하세요.
"""
import sys
import os

# 프로젝트 루트를 Python 경로에 추가
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    bcrypt__ident="2b",
    deprecated="auto"
)


def generate_hash(password: str) -> str:
    """비밀번호 해시 생성"""
    return pwd_context.hash(password)


def verify_hash(password: str, hashed: str) -> bool:
    """비밀번호 해시 검증"""
    return pwd_context.verify(password, hashed)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python generate_admin_hash.py <password>")
        print("예시: python generate_admin_hash.py mySecurePassword123!")
        sys.exit(1)
    
    password = sys.argv[1]
    
    # 비밀번호 강도 체크 (선택적 경고)
    if len(password) < 8:
        print("경고: 비밀번호가 8자 미만입니다. 더 긴 비밀번호를 권장합니다.")
    
    hashed = generate_hash(password)
    
    print("\n" + "=" * 60)
    print("관리자 비밀번호 해시 생성 완료")
    print("=" * 60)
    print(f"\n입력 비밀번호: {password}")
    print(f"\n생성된 해시:")
    print(hashed)
    print("\n.env 파일에 다음을 추가하세요:")
    print(f'ADMIN_PASSWORD_HASH="{hashed}"')
    print("\n" + "=" * 60)
    
    # 검증
    if verify_hash(password, hashed):
        print("검증 완료: 해시가 올바르게 생성되었습니다.")
    else:
        print("오류: 해시 검증에 실패했습니다!")
        sys.exit(1)

