"""테스트 사용자 생성 스크립트 - 비밀번호 해시 생성 및 DATABASE_DATA.sql 업데이트"""
import sys
import os

# 프로젝트 루트를 Python 경로에 추가
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# generate_password_hash.py의 함수 재사용
from generate_password_hash import update_data_sql

try:
    # bcrypt 모듈을 임시로 제거하여 passlib이 순수 Python 구현을 사용하도록 강제
    if 'bcrypt' in sys.modules:
        del sys.modules['bcrypt']
    
    from passlib.context import CryptContext
    
    # passlib의 순수 Python bcrypt 구현 강제 사용 (bcrypt 라이브러리 호환성 문제 회피)
    # bcrypt 모듈이 없으면 passlib이 자동으로 순수 Python 구현을 사용함
    pwd_context = CryptContext(
        schemes=["bcrypt"],
        bcrypt__ident="2b",
        deprecated="auto"
    )
    
    password = "user123"
    email = "user1@lune.com"
    
    print("비밀번호 해시 생성 중...")
    hashed = pwd_context.hash(password)
    
    print(f"\n생성된 해시: {hashed}\n")
    
    # DATABASE_DATA.sql 파일 업데이트
    if update_data_sql(hashed, email, password):
        print(f"✓ {email}의 비밀번호 해시가 DATABASE_DATA.sql에 저장되었습니다.")
    else:
        print(f"✗ {email}의 비밀번호 해시 저장 실패")
        print("\n수동으로 SQL 문을 사용하세요:")
        sql = f"""-- 테스트 사용자 추가 ({email}, 비밀번호: {password})
INSERT INTO users (id, email, name, password_hash, phone, marketing_agreed, is_active, created_at, updated_at) 
VALUES (
    uuid_generate_v4(),
    '{email}',
    '테스트 사용자1',
    '{hashed}',
    '01012345678',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);"""
        print("=" * 60)
        print("SQL 문:")
        print("=" * 60)
        print(sql)
        print("=" * 60)
    
except Exception as e:
    print(f"에러 발생: {e}")
    import traceback
    traceback.print_exc()
    print("\n대안: 온라인 bcrypt 해시 생성기 사용")
    print("https://bcrypt-generator.com/ 에서 'user123'의 해시를 생성하세요.")
    print("또는 Python에서 직접:")
    print("python -c \"import bcrypt; print(bcrypt.hashpw(b'user123', bcrypt.gensalt()).decode())\"")

