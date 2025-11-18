# LUNE 쇼핑몰 데이터베이스 설정 가이드

이 문서는 LUNE 쇼핑몰의 **Supabase PostgreSQL 데이터베이스**를 설정하는 방법을 정리한 가이드입니다.  
실제 스키마 정의와 초기 데이터 SQL은 `database/DATABASE_SCHEMA.sql` 파일 하나에서만 관리합니다.

---

## 1. 준비 사항

- Supabase 프로젝트가 이미 생성되어 있어야 합니다.
- Supabase Dashboard에 접속할 수 있는 계정.

---

## 2. 스키마 생성 및 초기 데이터 적용

### 2.1 Supabase SQL Editor에서 스키마 실행

1. 브라우저에서 Supabase Dashboard 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New query** 버튼 클릭
5. 로컬 프로젝트에서 `database/DATABASE_SCHEMA.sql` 파일을 열어 **전체 내용을 복사**
6. SQL Editor에 붙여넣고 **Run** 버튼 클릭

실행이 완료되면 다음이 생성됩니다.

- 주요 테이블
  - `users`
  - `products`
  - `orders`
  - `order_items`
  - `carts`
  - `wishlists`
  - `addresses`
  - `reviews`
  - `review_helpful`
  - `coupons`, `user_coupons`
  - `notifications`, `product_views`, `inquiries`
- 뷰 / 트리거 / RLS 정책
  - `product_review_stats`, `order_stats` 등 뷰
  - `update_*_updated_at` 트리거 함수와 각 테이블용 트리거
  - 기본적인 RLS 정책

> 참고: 스키마 파일에는 테스트용 사용자 1명과, 뷰/정책 정의까지 포함되어 있습니다.

### 2.2 샘플 상품 데이터 확인

`DATABASE_SCHEMA.sql`에는 샘플 사용자만 포함되어 있고, 상품 샘플 데이터는 주석으로 안내만 되어 있습니다.  
샘플 상품을 직접 넣고 싶다면:

1. Supabase SQL Editor에서 새 쿼리를 열고,
2. `database_setup.md`의 \"샘플 상품\" 섹션이나 별도의 SQL 파일에 정의한 INSERT 문을 실행합니다.
3. Table Editor에서 `products` 테이블에 데이터가 들어갔는지 확인합니다.

---

## 3. RLS(Row Level Security) 정책 확인

스키마 SQL에는 기본적인 RLS 정책 생성 구문이 포함되어 있습니다.  
적용 여부를 확인하려면:

1. Supabase Dashboard → **Table editor** → 테이블 선택 후 **RLS** 탭 확인
2. 최소한 다음 성격의 정책이 존재해야 합니다.
   - `products`: 활성화된 상품만 조회 가능 (`is_active = true`)
   - `users`, `orders`, `carts` 등: 서비스 역할 키에서만 전체 접근 가능 (`service_role` 정책)

운영 환경에서는 프로젝트 정책에 맞춰 추가/수정이 필요할 수 있습니다.

---

## 4. 애플리케이션에서의 연결

백엔드 FastAPI는 `.env`의 `DATABASE_URL` 값을 사용해 Supabase DB에 접속합니다.

1. Supabase Dashboard → **Project Settings > Database > Connection string (URI)**에서 접속 URL 확인
2. `.env`에 다음과 같이 설정:

```env
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/DB_NAME
```

- Supabase가 제공하는 URI가 `postgresql://...` 형식이라면, 앞부분만 `postgresql+psycopg://` 로 교체합니다.

---

## 5. 앞으로의 사용 방법

- **스키마 수정/추가**가 필요할 때는 항상 `database/DATABASE_SCHEMA.sql` 파일을 수정한 뒤,
  - 동일 내용을 Supabase SQL Editor에서 다시 실행해 반영합니다.
- 문서(`database/database_setup.md`)는 _실행 절차_만 설명하고, SQL은 이 파일에서 중복 관리하지 않습니다.

이렇게 해두면:

- DB 구조는 `database/DATABASE_SCHEMA.sql` 한 군데에서만 관리되고,
- Supabase에 반영할 때는 이 파일을 기준으로 움직이면 되어, 프론트엔드와 섞이지 않고 명확하게 유지됩니다.


