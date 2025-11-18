-- LUNE 쇼핑몰 데이터베이스 스키마
-- PostgreSQL 기준

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Users (회원) 테이블
-- ==========================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  marketing_agreed BOOLEAN DEFAULT false,
  -- 소셜 로그인 정보
  provider VARCHAR(50), -- google, naver, kakao, null (일반 회원가입)
  provider_id VARCHAR(255)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);

-- 회원 테이블 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 2. Products (상품) 테이블
-- ==========================================
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  original_price INTEGER,
  category VARCHAR(50)[] NOT NULL,
  colors VARCHAR(50)[] NOT NULL,
  sizes VARCHAR(10)[] NOT NULL,
  image_url TEXT NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  is_new BOOLEAN DEFAULT false,
  is_best BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products USING GIN(category);
CREATE INDEX idx_products_is_new ON products(is_new) WHERE is_new = true;
CREATE INDEX idx_products_is_best ON products(is_best) WHERE is_best = true;
CREATE INDEX idx_products_is_active ON products(is_active);

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 3. Orders (주문) 테이블
-- ==========================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', 
  -- pending(결제대기), paid(결제완료), preparing(상품준비중), 
  -- shipped(배송중), delivered(배송완료), cancelled(취소), refunded(환불)
  total_amount INTEGER NOT NULL,
  discount_amount INTEGER DEFAULT 0,
  shipping_fee INTEGER DEFAULT 3000,
  final_amount INTEGER NOT NULL,
  
  -- 배송 정보
  recipient_name VARCHAR(100) NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  address VARCHAR(255) NOT NULL,
  address_detail VARCHAR(255),
  delivery_message TEXT,
  
  -- 결제 정보
  payment_method VARCHAR(50) NOT NULL, -- card, bank_transfer, virtual_account, kakao_pay, etc.
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, failed, cancelled
  payment_key VARCHAR(255), -- PG사 결제 키
  paid_at TIMESTAMP,
  
  -- 배송 정보
  tracking_number VARCHAR(100),
  courier VARCHAR(50),
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  
  -- 취소/환불 정보
  cancelled_at TIMESTAMP,
  cancel_reason TEXT,
  refunded_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 4. Order_Items (주문 상품) 테이블
-- ==========================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL, -- 상품명 스냅샷
  product_image TEXT, -- 상품 이미지 스냅샷
  quantity INTEGER NOT NULL,
  color VARCHAR(50) NOT NULL,
  size VARCHAR(10) NOT NULL,
  price INTEGER NOT NULL, -- 구매 당시 가격
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ==========================================
-- 5. Carts (장바구니) 테이블
-- ==========================================
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  color VARCHAR(50) NOT NULL,
  size VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id, color, size)
);

CREATE INDEX idx_carts_user_id ON carts(user_id);

CREATE TRIGGER update_carts_updated_at
BEFORE UPDATE ON carts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 6. Wishlists (찜하기) 테이블
-- ==========================================
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlists_product_id ON wishlists(product_id);

-- ==========================================
-- 7. Addresses (배송지) 테이블
-- ==========================================
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  address VARCHAR(255) NOT NULL,
  address_detail VARCHAR(255),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);

CREATE TRIGGER update_addresses_updated_at
BEFORE UPDATE ON addresses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 기본 배송지 설정 시 기존 기본 배송지 해제
CREATE OR REPLACE FUNCTION set_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_default_address
BEFORE INSERT OR UPDATE ON addresses
FOR EACH ROW
EXECUTE FUNCTION set_default_address();

-- ==========================================
-- 8. Reviews (리뷰) 테이블
-- ==========================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  product_id INTEGER REFERENCES products(id),
  order_item_id UUID REFERENCES order_items(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  images TEXT[], -- 이미지 URL 배열
  helpful_count INTEGER DEFAULT 0, -- 도움이 돼요 카운트
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(order_item_id) -- 주문 상품당 1개의 리뷰만 작성 가능
);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 9. Review_Helpful (리뷰 도움돼요) 테이블
-- ==========================================
CREATE TABLE review_helpful (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(review_id, user_id)
);

CREATE INDEX idx_review_helpful_review_id ON review_helpful(review_id);

-- 리뷰 도움돼요 카운트 자동 업데이트
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_review_helpful_count
AFTER INSERT OR DELETE ON review_helpful
FOR EACH ROW
EXECUTE FUNCTION update_review_helpful_count();

-- ==========================================
-- 10. Coupons (쿠폰) 테이블
-- ==========================================
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL, -- percentage, fixed_amount
  discount_value INTEGER NOT NULL,
  min_purchase_amount INTEGER DEFAULT 0,
  max_discount_amount INTEGER,
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  usage_limit INTEGER, -- 전체 사용 제한
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_valid ON coupons(valid_from, valid_until);

-- ==========================================
-- 11. User_Coupons (사용자 쿠폰) 테이블
-- ==========================================
CREATE TABLE user_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  coupon_id UUID REFERENCES coupons(id),
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_coupons_user_id ON user_coupons(user_id);
CREATE INDEX idx_user_coupons_is_used ON user_coupons(is_used);

-- ==========================================
-- 12. Notifications (알림) 테이블
-- ==========================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- order, review, promotion, system
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ==========================================
-- 13. Product_Views (상품 조회 이력) 테이블
-- ==========================================
CREATE TABLE product_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id INTEGER REFERENCES products(id),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_views_product_id ON product_views(product_id);
CREATE INDEX idx_product_views_created_at ON product_views(created_at DESC);

-- ==========================================
-- 14. Inquiries (문의) 테이블
-- ==========================================
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  product_id INTEGER REFERENCES products(id),
  type VARCHAR(50) NOT NULL, -- product, order, delivery, return, general
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_answered BOOLEAN DEFAULT false,
  answer TEXT,
  answered_at TIMESTAMP,
  answered_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX idx_inquiries_is_answered ON inquiries(is_answered);

CREATE TRIGGER update_inquiries_updated_at
BEFORE UPDATE ON inquiries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 샘플 데이터 삽입 (테스트용)
-- ==========================================

-- 테스트 사용자
INSERT INTO users (email, name, password_hash, phone, marketing_agreed) VALUES
('test@lune.com', '테스트 사용자', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', '01012345678', true);

-- 상품 샘플 데이터는 기존 products.ts의 데이터를 마이그레이션할 것

-- ==========================================
-- 뷰 (View) 생성
-- ==========================================

-- 상품 평점 및 리뷰 수 뷰
CREATE OR REPLACE VIEW product_review_stats AS
SELECT 
  p.id as product_id,
  COUNT(r.id) as review_count,
  COALESCE(AVG(r.rating), 0) as average_rating
FROM products p
LEFT JOIN reviews r ON p.id = r.product_id
GROUP BY p.id;

-- 주문 통계 뷰 (관리자용)
CREATE OR REPLACE VIEW order_stats AS
SELECT 
  DATE(created_at) as order_date,
  COUNT(*) as order_count,
  SUM(final_amount) as total_revenue,
  AVG(final_amount) as average_order_value
FROM orders
WHERE status NOT IN ('cancelled', 'refunded')
GROUP BY DATE(created_at)
ORDER BY order_date DESC;


