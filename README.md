# 삼일PwC 온라인 NPL 플랫폼

매도인(금융기관) · 매수인(F&I, 자산운용사) · 회계법인(삼일PwC) 간 NPL(Non-Performing Loan) Pool 거래 정보, 거래 자료 파일, 상담을 중개하는 웹 플랫폼.

## 기술 스택

| 계층 | 기술 |
|---|---|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Backend | FastAPI (Python 3.12, async/await) |
| Database | PostgreSQL 16 (SQLAlchemy 2.0 async + Alembic) |
| Cache | Redis 7 (Refresh Token, 세션 블랙리스트) |
| 인증 | 이메일 + bcrypt + JWT (Access Token 메모리, Refresh Token HttpOnly Cookie) |

## 시작하기

### 사전 요구사항

- Docker & Docker Compose
- Node.js 18+
- Python 3.12+

### 실행

```bash
# 1. Backend (Docker Compose)
docker compose up -d

# 2. Frontend
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/v1
- API Docs: http://localhost:8000/docs

### 테스트

```bash
docker compose exec backend pytest tests/ -v
```

## 프로젝트 구조

```
npl_platform/
├── backend/
│   └── app/
│       ├── api/v1/routers/     # FastAPI 라우터 (8개)
│       ├── api/v1/dependencies/ # 인증·권한 의존성
│       ├── models/             # SQLAlchemy ORM (10개 모델)
│       ├── schemas/            # Pydantic v2 스키마
│       ├── services/           # 비즈니스 로직
│       ├── repositories/       # DB 쿼리
│       └── core/               # 설정, 보안, DB, 암호화
├── frontend/
│   └── src/
│       ├── app/                # Next.js App Router
│       │   ├── (public)/       # 공개 페이지 (홈, 서비스, 로그인)
│       │   └── (authenticated)/ # 인증 필요 페이지
│       ├── components/         # UI 컴포넌트
│       ├── lib/                # api.ts, auth.ts, rbac.ts
│       ├── hooks/              # 커스텀 훅
│       └── types/              # TypeScript 타입
└── .claude/                    # 프로젝트 컨텍스트 문서
```

## 사용자 역할 (RBAC)

| 역할 | 설명 | 권한 |
|---|---|---|
| admin | 삼일PwC 최고 관리자 | 전체 접근 |
| accountant | 삼일PwC 담당자 | admin과 동일 |
| seller | 매도인 (금융기관) | Pool 조회, 매도인 자료 관리 |
| buyer | 매수인 (F&I, 자산운용사) | Pool 조회, 매수인 자료 관리 |
| pending | 가입 후 대기 | 접근 불가 |

## API 엔드포인트

| 그룹 | 경로 | 인증 |
|---|---|---|
| Auth | POST /auth/register, /login, /refresh, /logout | 공개/인증 |
| Pools | GET/POST /pools, GET/PATCH /pools/{id} | require_role |
| Documents | GET/POST /documents, GET/PATCH /documents/{id} | require_role |
| Notices | GET/POST /notices, PATCH/DELETE /notices/{id} | get_current_user / require_role |
| Glossary | GET /glossary | 공개 |
| Consulting | POST/GET /consulting | get_current_user |
| Admin | GET/PATCH /admin/users, POST reset-password, GET/POST consulting | require_role(admin, accountant) |
| Users | GET/PATCH /users/me | get_current_user |

## 보안

- Access Token: 메모리 변수 (XSS 방지, localStorage 사용 금지)
- Refresh Token: HttpOnly + SameSite=Lax 쿠키
- 파일 경로: AES-256-CBC 암호화 저장 (평문 노출 금지)
- 파일 다운로드: StreamingResponse 경유 (직접 URL 금지)
- 모든 PATCH: `reason` 필드 필수 (빈 문자열 → 422)
- 감사 로그: audit_logs 테이블에 old_data/new_data/reason/IP 기록
- Pool 미공개 필드: 참여이력 없는 업체에게 null 반환

## 환경변수

`backend/.env` 참조. 절대 git 커밋 금지.

| 변수 | 설명 |
|---|---|
| DATABASE_URL | PostgreSQL 비동기 연결 문자열 |
| REDIS_URL | Redis 연결 |
| JWT_SECRET_KEY | JWT 서명 키 |
| FILE_ENCRYPTION_KEY | AES-256 파일 경로 암호화 키 (정확히 32자) |
| ALLOWED_ORIGINS | CORS 허용 오리진 |
