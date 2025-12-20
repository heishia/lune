-- 004_add_user_address_social.sql
-- 사용자 테이블에 주소 및 소셜 로그인 정보 컬럼 추가 (카카오싱크 연동용)

-- 주소 정보 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_detail VARCHAR(255);

-- 소셜 로그인 정보 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_provider VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_id VARCHAR(100);

-- 프로필 완성 여부 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT FALSE;

-- 기존 사용자들 중 필수 정보가 모두 있는 경우 프로필 완성으로 설정
UPDATE users 
SET is_profile_complete = TRUE 
WHERE name IS NOT NULL 
  AND name != '' 
  AND phone IS NOT NULL 
  AND phone != '';

-- 소셜 로그인 사용자 검색을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_users_social_provider_id ON users(social_provider, social_id);

-- 코멘트 추가
COMMENT ON COLUMN users.postal_code IS '우편번호 (카카오싱크 배송지 연동)';
COMMENT ON COLUMN users.address IS '기본 주소';
COMMENT ON COLUMN users.address_detail IS '상세 주소';
COMMENT ON COLUMN users.social_provider IS '소셜 로그인 제공자 (kakao, google, naver)';
COMMENT ON COLUMN users.social_id IS '소셜 플랫폼의 사용자 고유 ID';
COMMENT ON COLUMN users.is_profile_complete IS '필수 프로필 정보 입력 완료 여부';

