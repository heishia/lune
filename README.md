# LUNE - Fashion E-Commerce Platform

LUNE은 패션 의류 쇼핑몰을 위한 풀스택 웹 애플리케이션입니다.

## Tech Stack

### Backend
- **Framework**: FastAPI 0.115.0
- **Database**: PostgreSQL (Supabase)
- **ORM**: SQLAlchemy 2.0.35
- **Authentication**: JWT (python-jose) + bcrypt
- **Validation**: Pydantic 2.9.2
- **Server**: Uvicorn
- **Deployment**: Railway (Docker)

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 6.3.5
- **Language**: TypeScript 5.6.3
- **Styling**: TailwindCSS 3.4.18
- **State Management**: Zustand 5.0.0
- **UI Components**: Radix UI + shadcn/ui
- **Routing**: React Router 6.28.0
- **Charts**: Recharts 2.15.2
- **Deployment**: Vercel

### Payment
- Supabase Edge Functions (Hono)
- Toss Payments Integration

## Project Structure

```
lune/
├── backend/                 # FastAPI 백엔드
│   ├── admin/              # 관리자 기능
│   ├── auth/               # 인증 (로그인/회원가입/OAuth)
│   ├── banners/            # 배너 관리
│   ├── cart/               # 장바구니
│   ├── contents/           # 콘텐츠 관리
│   ├── core/               # 핵심 설정 (DB, 보안, 예외처리)
│   ├── coupons/            # 쿠폰 시스템
│   ├── instagram/          # 인스타그램 피드 연동
│   ├── kakao/              # 카카오 OAuth
│   ├── orders/             # 주문 처리
│   ├── products/           # 상품 관리
│   ├── reviews/            # 리뷰 시스템
│   ├── uploads/            # 파일 업로드
│   └── tests/              # 테스트 코드
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   ├── stores/         # Zustand 스토어
│   │   ├── types/          # TypeScript 타입 정의
│   │   ├── utils/          # 유틸리티 함수
│   │   └── guidelines/     # 브랜드 가이드라인
│   └── supabase/
│       └── functions/      # Edge Functions (결제)
├── database/               # SQL 스키마 및 마이그레이션
└── docs/                   # 문서
```

## API Endpoints

| Module | Prefix | Description |
|--------|--------|-------------|
| Auth | `/auth` | 회원가입, 로그인, 토큰 관리 |
| Products | `/products` | 상품 CRUD, 검색, 필터링 |
| Cart | `/cart` | 장바구니 관리 |
| Orders | `/orders` | 주문 생성 및 조회 |
| Reviews | `/reviews` | 상품 리뷰 |
| Coupons | `/coupons` | 쿠폰 발급 및 사용 |
| Banners | `/banners` | 이벤트 배너 관리 |
| Contents | `/contents` | 콘텐츠 관리 |
| Instagram | `/instagram` | 인스타그램 피드 연동 |
| Kakao | `/kakao` | 카카오 OAuth |
| Admin | `/admin` | 관리자 대시보드 |
| Uploads | `/uploads` | 이미지 업로드 |

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (or Supabase account)

### Backend Setup

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일 편집

# 서버 실행
python run.py
```

### Frontend Setup

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### Environment Variables

#### Backend (.env)
```env
ENV=local
DEBUG=true
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secret-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
KAKAO_REST_API_KEY=your-kakao-key
KAKAO_CLIENT_SECRET=your-kakao-secret
KAKAO_REDIRECT_URI=http://localhost:5173/auth/kakao/callback
ADMIN_EMAIL=admin
ADMIN_PASSWORD_HASH=bcrypt-hashed-password
```

## Testing

### Backend
```bash
cd backend
pytest
pytest --cov=.  # 커버리지 포함
```

### Frontend
```bash
cd frontend
npm run test
npm run test:coverage
```

## Deployment

### Backend (Railway)
Railway에서 자동으로 `Dockerfile`을 사용하여 빌드 및 배포됩니다.

### Frontend (Vercel)
Vercel에서 자동으로 `npm run build`를 실행하여 배포됩니다.

## Features

- 회원 관리 (이메일/카카오 로그인)
- 상품 검색 및 필터링
- 장바구니 및 위시리스트
- 주문 및 결제 (Toss Payments)
- 쿠폰 및 포인트 시스템
- 상품 리뷰
- 관리자 대시보드
- 인스타그램 피드 연동
- 이벤트 배너 관리

## License

Private - All rights reserved

---

**Version**: 0.1.0

