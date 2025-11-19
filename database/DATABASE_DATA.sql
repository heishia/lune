-- LUNE 쇼핑몰 샘플 데이터
-- PostgreSQL 기준
-- 
-- 사용 방법:
-- 1. 먼저 DATABASE_SCHEMA.sql을 실행하여 테이블을 생성하세요
-- 2. 그 다음 이 파일을 실행하여 샘플 데이터를 삽입하세요 -- 테스트사용자 주석추가 한뒤 generate_password_hash.py 실행
-- 
-- ==========================================
-- 샘플 데이터 삽입 (테스트용)
-- ==========================================

-- 테스트 사용자 (test@lune.com, 비밀번호: test123)

INSERT INTO users (email, name, password_hash, phone, marketing_agreed, is_active) VALUES
('test@lune.com', '테스트 사용자', '$2b$12$E7bZa8dXFufp3KXmUd4bceede6OPyZL5Lq3QfdF..3Kl3CtbqxKn2', '01012345678', true, true);

-- 테스트 사용자 (user2@lune.com, 비밀번호: user123)
INSERT INTO users (email, name, password_hash, phone, marketing_agreed, is_active) VALUES
('user2@lune.com', '테스트 사용자', '$2b$12$FdVs8PdhV8XSLEUzXH0fa.yN.wv5suQAoYks2WRsy.cY26OnJqUyi', '01012345678', true, true);




