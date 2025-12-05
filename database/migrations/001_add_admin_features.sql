-- LUNE 관리자 기능 마이그레이션 스크립트
-- 기존 데이터베이스에 배너, 포인트 테이블 추가 및 users 테이블 수정

-- ==========================================
-- 1. Users 테이블에 새 컬럼 추가
-- ==========================================

-- is_admin 컬럼 추가 (관리자 여부)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- points 컬럼 추가 (보유 포인트)
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- ==========================================
-- 2. Banners (배너) 테이블 생성
-- ==========================================
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  banner_image TEXT NOT NULL,
  content_blocks JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_banners_is_active ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON banners(display_order);

-- 배너 업데이트 트리거 (update_updated_at_column 함수는 이미 존재한다고 가정)
DROP TRIGGER IF EXISTS update_banners_updated_at ON banners;
CREATE TRIGGER update_banners_updated_at
BEFORE UPDATE ON banners
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 3. User_Points (포인트 내역) 테이블 생성
-- ==========================================
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_created_at ON user_points(created_at DESC);

-- 포인트 지급 시 사용자 포인트 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET points = points + NEW.points WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_points ON user_points;
CREATE TRIGGER trigger_update_user_points
AFTER INSERT ON user_points
FOR EACH ROW
EXECUTE FUNCTION update_user_points();

-- ==========================================
-- 4. Contents (콘텐츠/에디터) 테이블 생성
-- ==========================================
CREATE TABLE IF NOT EXISTS contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content_type VARCHAR(50) NOT NULL DEFAULT 'product', -- product, banner, post, etc.
  reference_id VARCHAR(255), -- 연결된 상품/배너 ID (nullable)
  blocks JSONB DEFAULT '[]'::jsonb, -- 에디터 블록 데이터
  thumbnail_url TEXT, -- 대표 이미지
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contents_content_type ON contents(content_type);
CREATE INDEX IF NOT EXISTS idx_contents_reference_id ON contents(reference_id);
CREATE INDEX IF NOT EXISTS idx_contents_created_by ON contents(created_by);
CREATE INDEX IF NOT EXISTS idx_contents_is_published ON contents(is_published);

DROP TRIGGER IF EXISTS update_contents_updated_at ON contents;
CREATE TRIGGER update_contents_updated_at
BEFORE UPDATE ON contents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 완료 메시지
-- ==========================================
-- 마이그레이션이 성공적으로 적용되었습니다.
-- 이제 관리자 페이지에서 배너 관리, 포인트 관리, 콘텐츠 에디터 기능을 사용할 수 있습니다.

