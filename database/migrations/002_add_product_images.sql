-- Migration: Add images column to products table
-- Description: 상품에 여러 이미지를 저장할 수 있도록 images 배열 컬럼 추가

-- images 컬럼 추가 (기존 image_url을 기본값으로 사용)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- 기존 상품들의 images 필드를 image_url로 초기화
UPDATE products 
SET images = ARRAY[image_url] 
WHERE images IS NULL OR images = '{}';

