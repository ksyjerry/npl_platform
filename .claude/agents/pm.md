# PM Agent — 태스크 분해 오케스트레이터

## 역할
전체 구현을 Phase별로 분해하고 각 Agent에 작업을 할당한다.
API 계약 / DB 스키마를 먼저 확정하고, 수직(레이어별 순서) 구현을 원칙으로 한다.

---

## 구현 Phase 순서

```
Phase 1 — 기반 (DB + Core)
Phase 2 — 인증 (Auth end-to-end)
Phase 3 — Pool 거래현황 (C2-1 + C2-2)
Phase 4 — 거래자료 (C3 파일 업로드/다운로드)
Phase 5 — 공지사항 + 용어사전 + 상담 (C1, D2, B1/B2)
Phase 6 — 관리자 + 감사로그 (Z1, Z2, Y)
Phase 7 — 통합 점검
```

### Phase 1 — 기반 세팅
```
CLAUDE.md, agents/backend.md, context/domain-model.md 읽고 시작.

Backend:
  requirements.txt
  core/(config, database, redis_client, security, crypto, file_validator)
  models/ 전체 (company, user, pool, pool_participant, pool_company,
                 document, notice, glossary, consulting, audit_log)
  alembic 초기 설정 + 첫 마이그레이션
  docker-compose.yml
  backend/.env

완료 기준: docker-compose up → DB 연결 확인
```

### Phase 2 — 인증
```
agents/backend.md + agents/frontend.md + context/api-contracts.md 읽고 시작.

Backend:
  dependencies/auth.py (get_current_user, require_role)
  schemas/auth + user
  repositories/user
  services/auth
  routers/auth (register, login, refresh, logout)
  main.py에 router 등록
  tests/test_auth.py

Frontend:
  lib/auth.ts (Access Token 메모리 저장)
  lib/api.ts (401 시 자동 갱신 인터셉터)
  types/user.ts
  app/(public)/auth/login/page.tsx
  app/(public)/auth/register/page.tsx  ← X 회원가입 (9개 필수 + 관심분야 + 약관 3개)
  app/(authenticated)/layout.tsx (인증 가드 + pending 차단)
  middleware.ts

완료 기준: 회원가입 → pending 상태 → JWT 발급 → 401 자동 갱신
```

### Phase 3 — Pool 거래현황
```
agents/backend.md + agents/frontend.md + context/domain-model.md
+ context/api-contracts.md + skills/pool-detail.md + skills/rbac-masking.md 읽고 시작.

Backend:
  schemas/pool (reason 포함, PoolCreateSchema, PoolUpdateSchema, PoolResponse)
  repositories/pool (get_all, get_active, get_or_404, check_participation)
  services/pool (역할별 필터링, 미공개 필드 마스킹, 참여이력 검증)
  routers/pools (GET /pools, POST /pools, GET /pools/{id}, PATCH /pools/{id})
  tests/test_pools.py (역할별 4케이스: 정상/403/401/422)

Frontend:
  types/pool.ts
  hooks/usePools.ts (TanStack Query)
  lib/rbac.ts (can() 함수 + PERMISSIONS 맵)
  components/pools/PoolTable.tsx (정렬: 진행→종결→중단)
  components/pools/PoolStatusBadge.tsx (진행=blue, 종결=gray, 중단=red)
  components/pools/PoolDetailForm.tsx (섹션별 입력: 6개 섹션)
  components/ui/ReasonModal.tsx (수정 사유 입력 공통 모달)
  app/(authenticated)/pools/page.tsx (C2-1)
  app/(authenticated)/pools/[id]/page.tsx (C2-2)

Security 체크 (agents/security.md):
  - seller/buyer active Pool 미공개 필드 마스킹 확인
  - closed Pool 참여이력 검증 로직 확인
  - require_role 누락 여부 확인
```

### Phase 4 — 거래자료 파일
```
agents/backend.md + skills/file-upload.md + agents/security.md 읽고 시작.

Backend:
  core/file_validator.py (확장자 + MIME 이중 검증)
  services/file_storage.py (mock/azure_blob/file_server 추상화)
  schemas/document
  repositories/document
  services/document (역할별 접근 검증 + audit_log 기록)
  routers/documents (GET, POST /upload, GET /{id}/download, PATCH)
  tests/test_documents.py

Frontend:
  types/document.ts
  hooks/useDocuments.ts
  components/documents/FileUploadZone.tsx (react-dropzone, Pool 드롭다운)
  components/documents/DocumentTable.tsx (No, Pool명, 등록회사, 등록자, 파일명, 💾, 🗒️, 날짜)
  app/(authenticated)/documents/seller/page.tsx (C3-s)
  app/(authenticated)/documents/buyer/page.tsx (C3-b)
  app/(authenticated)/documents/accountant/page.tsx (C3-a)

Security 체크:
  - file_path_enc 암호화 확인
  - StreamingResponse 경유 확인
  - role_type 권한 매트릭스 확인
  - 매수인 IP 화이트리스트 구조(비활성화) 확인
```

### Phase 5 — 공지사항 + 용어사전 + 상담
```
agents/backend.md + agents/frontend.md + context/api-contracts.md 읽고 시작.

Backend:
  schemas/notice + glossary + consulting
  repositories/notice + glossary + consulting
  services/notice + glossary + consulting
  routers/notices + glossary + consulting
  glossary seed 데이터 (11개 — CLAUDE.md 섹션 7 참조)

Frontend:
  app/(authenticated)/notices/page.tsx (C1 — No/구분/제목/💾/등록일자)
  app/(authenticated)/notices/[id]/page.tsx (우측 패널: 구분/제목/내용/첨부)
  app/(authenticated)/support/glossary/page.tsx (D2 — 11개 용어)
  app/(authenticated)/support/guide/page.tsx (D1)
  app/(authenticated)/support/faq/page.tsx (D3)
  app/(public)/service/selling/page.tsx (B1 — 매각 상담 신청 버튼 포함)
  app/(public)/service/buying/page.tsx (B2 — 인수 상담 신청 버튼 포함)
```

### Phase 6 — 관리자 + 감사로그 + 마이페이지
```
agents/backend.md + skills/audit-log.md + agents/security.md 읽고 시작.

Backend:
  middleware/audit_log.py (PATCH reason 강제)
  repositories/audit_log
  routers/admin (회원목록, 역할변경, 비밀번호초기화, 상담답변)
  routers/users (GET /users/me, PATCH /users/me)

Frontend:
  app/(authenticated)/mypage/page.tsx
    - 가입회사 정보: 회사명/대표자/담당부서대표전화/담당부서명/우편번호/주소
    - 사용자 정보: 성명/소속부점/직책/회사전화/휴대전화/이메일/접속IP/인증여부
  app/(authenticated)/admin/users/page.tsx (Z1 — 회원 목록 + [수정]/[삭제])
  app/(authenticated)/admin/consulting/page.tsx (Z2 — 상담 목록 + [답글작성])
  components/auth/RoleGuard.tsx
  components/layout/(Header, Sidebar, NavMenu)

Security 체크:
  - 모든 PATCH audit_log 기록 확인
  - admin 페이지 require_role 확인
```

### Phase 7 — 통합 점검
```
agents/security.md 전체 체크리스트 실행

1. 모든 라우터 require_role 누락 grep
   grep -rn "router\." backend/app/api --include="*.py" | grep -v "require_role"

2. file_path 평문 저장 grep
   grep -rn "file_path" backend/app --include="*.py" | grep -v "enc\|encrypt"

3. .env .gitignore 포함 확인
4. docker-compose up → pytest 전체 실행
5. README.md 작성
```

---

## Agent 작업 매핑

| 기능 요청 | Backend | Frontend | Infra | Security |
|---|---|---|---|---|
| 새 CRUD | API + DB 스키마 | 페이지 + 컴포넌트 | 환경변수 추가 시 | RBAC + 감사로그 |
| 파일 업로드 | upload 엔드포인트 | FileUploadZone | 스토리지 설정 | 경로암호화 + MIME |
| 인증 변경 | auth 라우터 | 로그인 페이지 | — | 토큰 보안 |
| 배포 설정 | — | — | Docker + Azure | 시크릿 관리 |

---

## 충돌 해소 기준

- API 스펙 충돌 → context/api-contracts.md 기준
- DB 스키마 충돌 → context/domain-model.md 기준
- 보안 요구사항 충돌 → Security Agent 판단 우선
- 코딩 스타일 충돌 → CLAUDE.md 컨벤션 기준
