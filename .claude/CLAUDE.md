# 삼일PwC 온라인 NPL 플랫폼 — 프로젝트 마스터 컨텍스트

> 화면설계서 Draft v2 (2026-03-03) 기반. 구현 전 반드시 이 파일을 먼저 읽어라.

## 0. 작업 시작 전 필수 파일 로드 순서

새 작업을 시작할 때 반드시 이 순서로 읽어라:

1. `.claude/CLAUDE.md`           (지금 이 파일 — 자동 로드)
2. `.claude/context/domain-model.md`
3. `.claude/context/api-contracts.md`
4. `.claude/context/security-policy.md`

컴포넌트 구현 시:
→ `.claude/skills/design-system.md` 먼저 읽기

파일 처리 관련:
→ `.claude/skills/file-upload.md`

Pool 상세 구현 시:
→ `.claude/skills/pool-detail.md`
→ `.claude/skills/rbac-masking.md`

DB 수정·감사 로그:
→ `.claude/skills/audit-log.md`

---

## 1. 플랫폼 개요

삼일PwC 온라인 NPL(Non-Performing Loan) 플랫폼.
매도인(금융기관) · 매수인(F&I, 자산운용사) · 회계법인(삼일PwC) 간
Pool 거래 정보, 거래 자료 파일, 상담을 중개하는 웹 플랫폼.

**플랫폼 가칭:** 삼일PwC 온라인 NPL 플랫폼

---

## 2. 기술 스택

| 계층 | 기술 |
|---|---|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Backend | FastAPI (Python 3.12, async/await) |
| Database | PostgreSQL 16 (SQLAlchemy 2.0 async + Alembic) |
| Cache | Redis 7 (Refresh Token, 세션 블랙리스트) |
| 배포 | Azure App Service + Azure Database for PostgreSQL |
| 파일 | 추상화 레이어: mock → azure_blob → file_server |
| 인증 | MVP = 이메일+bcrypt+JWT / 정식 = PwC SSO (Azure AD) |

---

## 3. 사용자 역할 (RBAC)

```
admin       : 삼일PwC 최고 관리자 (전체 접근)
accountant  : 삼일PwC 담당자 (admin과 동일 권한, MVP에서는 구분 최소화)
seller      : 매도인 (금융기관) — 인증 완료 후 활성
buyer       : 매수인 (F&I, 자산운용사) — 인증 완료 후 활성
pending     : 회원가입 후 관리자 인증 대기 (아무것도 못함)
```

**역할 부여 흐름:**
1. 회원가입 → role=pending, is_verified=false
2. 관리자가 Z1 회원 관리에서 역할 지정 + 인증 처리
3. 인증 완료(is_verified=true) 시 서비스 이용 가능

---

## 4. 전체 페이지 구조 & 접근 권한

| 코드 | 경로 | 페이지명 | 회계법인 | 매도인 | 매수인 |
|---|---|---|:---:|:---:|:---:|
| A   | /                      | 홈                          | O | △ | △ |
| B1  | /service/selling        | 매각 자문 + 상담 신청 버튼  | O | O | O |
| B2  | /service/buying         | 인수 자문 + 상담 신청 버튼  | O | O | O |
| C1  | /notices                | 공지사항                    | O | △ | △ |
| C2-1| /pools                  | Pool 목록 (거래현황)        | O | △ | △ |
| C2-2| /pools/[id]             | Pool 상세정보               | O | △* | △* |
| C3-s| /documents/seller       | 거래자료 등록 (매도인)      | O | O | X |
| C3-b| /documents/buyer        | 거래자료 등록 (매수인)      | O | X | O |
| C3-a| /documents/accountant   | 거래자료 등록 (회계법인)    | O | X | X |
| D1  | /support/guide          | 이용가이드                  | O | △ | △ |
| D2  | /support/glossary       | 용어사전                    | O | △ | △ |
| D3  | /support/faq            | FAQ                         | O | △ | △ |
| X   | /auth/register          | 회원가입                    | O | O | O |
| Y   | /mypage                 | 마이페이지                  | O | O | O |
| Z1  | /admin/users            | 회원 관리 (관리자)          | O | X | X |
| Z2  | /admin/consulting       | 상담 관리 (관리자)          | O | X | X |

△* = closed Pool만, 참여이력 있는 업체에게만 제공

---

## 5. 핵심 비즈니스 규칙

### Rule 1. Pool 미공개 필드 (4개)
다음 필드는 해당 Pool에 참여이력(pool_participants)이 있는 업체에게만 공개:
- collateral_large (담보유형 대분류)
- collateral_small (담보유형 소분류)
- seller_name (양도인)
- buyer_name (양수인)
→ 참여이력 없는 업체에게는 null 반환 (인센티브 성격)

### Rule 2. Pool 상세 열람 조건
- status=active   → seller/buyer는 기본 정보만 (미공개 필드 마스킹)
- status=closed   → pool_participants에 company_id 있는 업체만 전체 열람
- status=cancelled→ seller/buyer 열람 불가 (403)

### Rule 3. 수정 사유 필수
모든 PATCH에 reason 필드 필수. 빈 문자열 → 422.
audit_logs에 old_data/new_data/reason/IP/수행자 기록.

### Rule 4. 파일 경로 암호화
documents.file_path_enc = AES-256 암호화된 경로.
클라이언트에 경로 절대 노출 금지. 다운로드 = FastAPI StreamingResponse 경유.

### Rule 5. 거래자료 역할별 접근
role_type=seller     → seller, accountant, admin
role_type=buyer      → buyer, accountant, admin
role_type=accountant → accountant, admin

### Rule 6. 매각가율 자동 계산
sale_ratio = sale_price / opb — GENERATED STORED 컬럼, 입력 불가.

### Rule 7. 가입 후 pending
신규 가입 → role=pending, is_verified=false.
관리자가 Z1에서 역할 지정 후 인증 처리.

### Rule 8. IP 화이트리스트 (구조만 준비)
매수인 문서 업로드 시 IP 검증 구조 준비. MVP에서는 비활성화.

---

## 6. Pool 상세 입력 필드 (C2-2)

거래 정보: Pool명, 자산확정일(📅), 입찰기일(📅), 거래종결일(📅), 매각방식(드롭다운), 입찰참여자수
거래 참여자: 양도인(드롭다운·복수), 양도인자문사, 양수인(드롭다운·복수), 양수인자문사, 양수인점검표확인여부(Y/N)
담보 정보: 담보유형(대) 담보/무담보, 담보유형(소) Regular/Special/CCRS/IRL/일반무담보/기타
채권 정보: 차주구분(복수), 차주수, 채권수, 평균연체기간(개월), OPB(원)
가격 정보: 양수도가격(원), 매각가율(%) [자동계산 입력불가]
재매각 정보: 재매각채권포함여부(Y/N), 차주수/채권수/OPB(재매각분)
기타: 비고, Invitation Letter💾, Bid Package💾, 입찰서류(투자자제출본)💾, 기타자료💾

---

## 7. 용어 사전 seed (11개 — 초기 데이터 필수)

NPL, 자산확정일(Cut-off Date), 매각대상자산, Data Disk,
Invitation Letter(IL), 입찰참가의향서(LOI), 비밀유지서약서(NDA),
적격 투자자, Bid Package, 자산양수도계약서(LSPA), Interim

---

## 8. 코딩 컨벤션

Python: 비동기 일관성, 의존성 체인(인증→역할→로직), Pydantic v2 model_config
TypeScript: 서버 컴포넌트 기본, lib/api.ts 경유, lib/rbac.ts can() 함수, Access Token 메모리 변수

---

## 9. 절대 금지

- 환경변수 하드코딩 (JWT_SECRET, DB PW, FILE_ENCRYPTION_KEY)
- 파일 서버 경로 평문 저장 (encrypt_path() 필수)
- require_role() 없는 엔드포인트
- reason 없는 PATCH 허용
- 파일 직접 URL 클라이언트 노출
- pool_participants 체크 없는 closed Pool 상세 열람
- Access Token을 localStorage에 저장
- .env 파일 git 커밋

---

## 10. 미결 사항

| 우선순위 | 항목 | 내용 |
|---|---|---|
| High | 공지사항 운영 범위 | 일반 공지 전체 vs. 진행 중 거래 관련만 |
| High | 파일 업로드 방식 | CSV import vs. xlsx 직접 업로드 |
| High | PIPA 대응 | Datadisk 개인정보 포함 시 컴플라이언스 |
| Medium | IP 접속 제한 | 매수인 문서 업로드 IP 화이트리스트 범위 |
| Medium | 참여이력 관리 | pool_participants 등록 주체 및 방식 |
| Low | 매수인 자료 등록 | 입찰서류 전산 제출 방식 (추후) |
| Low | NPL성 실물자산 | B1 매각 자문 페이지 반영 |

---

## 11. .claude/ 폴더 구조

agents/backend.md    — FastAPI 구현 패턴 (라우터/서비스/레포/스키마)
agents/frontend.md   — Next.js 14 구현 패턴 (페이지/컴포넌트/API)
agents/infra.md      — Docker/Azure 설정
agents/pm.md         — 태스크 분해 오케스트레이터
agents/security.md   — 보안 리뷰 체크리스트
context/domain-model.md   — ERD & 테이블 전체 정의
context/api-contracts.md  — API 스펙 전체
context/security-policy.md— RBAC 매트릭스
skills/audit-log.md       — 감사 로그 패턴
skills/file-upload.md     — 파일 암호화/스트리밍
skills/pool-detail.md     — Pool 열람 권한 구현 패턴 ★
skills/rbac-masking.md    — 필드 마스킹 구현 패턴 ★
