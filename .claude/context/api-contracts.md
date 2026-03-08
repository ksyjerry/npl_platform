# API Contracts — 인터페이스 정의

Base URL: `/api/v1`
인증: `Authorization: Bearer {access_token}`
공통 에러: `{"detail": "메시지"}`

| 코드 | 의미 |
|---|---|
| 400 | 잘못된 요청 (파일 형식, 파라미터 오류) |
| 401 | 인증 필요 또는 토큰 만료 |
| 403 | 권한 없음 또는 인증 대기(pending) |
| 404 | 리소스 없음 |
| 409 | 충돌 (중복 이메일 등) |
| 413 | 파일 크기 초과 (500MB) |
| 422 | 유효성 검사 실패 (reason 누락 등) |
| 500 | 서버 오류 |

---

## Auth

### POST /auth/register
```json
Request:
{
  "member_type": "seller",           // seller | buyer | accountant
  "name": "홍길동",
  "company_name": "OO저축은행",
  "department": "여신관리부",
  "title": "과장",
  "phone_office": "02-1234-5678",
  "phone_mobile": "010-1234-5678",
  "email": "hong@company.com",
  "password": "string (min 6)",
  "password_confirm": "string",
  "interests": ["담보", "무담보"],    // 선택
  "terms_1": true,                    // 약관 1 필수
  "terms_2": true,
  "terms_3": true
}

Response 201:
{ "id": 1, "email": "hong@company.com", "role": "pending", "is_verified": false }

Error 409: 이미 존재하는 이메일
Error 422: 비밀번호 불일치 또는 최소 6자 미충족
```

### POST /auth/login
```json
Request: { "email": "hong@company.com", "password": "string" }

Response 200:
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
// Refresh Token은 HttpOnly 쿠키로 자동 설정

Error 401: 이메일/비밀번호 불일치
Error 403: 관리자 인증 대기(is_verified=false) 또는 pending 상태
```

### POST /auth/refresh
```
Request: (Refresh Token 쿠키 자동 전송)
Response 200: { "access_token": "eyJ..." }
Error 401: 만료 또는 유효하지 않은 Refresh Token
```

### POST /auth/logout
```
Authorization 필요
Response 200: { "message": "로그아웃 되었습니다." }
// Redis에서 Refresh Token 삭제
```

---

## Pools (C2)

### GET /pools
```
Authorization 필요
Query: ?status=active&page=1&size=20

Response 200:
{
  "items": [
    {
      "id": 1,
      "name": "PwC-SB 2026-1 Program",
      "status": "active",
      "collateral_large": null,        // 참여이력 없으면 null
      "collateral_small": null,
      "cutoff_date": "2025-12-31",
      "bid_date": "2026-02-27",
      "closing_date": null,
      "seller_name": null,             // 참여이력 없으면 null
      "buyer_name": null,
      "opb": 125000000000,
      "sale_price": null,
      "sale_ratio": null,
      "remarks": null,
      "can_view_detail": false         // 상세보기 링크 활성화 여부
    }
  ],
  "total": 10,
  "page": 1,
  "size": 20
}
// 정렬: active → closed → cancelled 순
```

### POST /pools
```
Authorization 필요 | Role: admin, accountant

Request: (PoolCreateSchema — 모든 필드 Optional, name만 필수)
{
  "name": "PwC-SB 2026-2 Program",
  "collateral_large": "무담보",
  "collateral_small": "CCRS&IRL",
  "cutoff_date": "2026-01-15",
  "bid_date": "2026-02-28",
  "opb": 80000000000
}
Response 201: PoolDetail
```

### GET /pools/{pool_id}
```
Authorization 필요

Response 200: PoolDetail (전체 섹션)
  거래정보, 거래참여자, 담보정보, 채권정보, 가격정보, 재매각정보, 기타(파일 4개)

Error 403: 참여이력 없는 closed Pool | cancelled Pool | pending 사용자
Error 404: 존재하지 않는 Pool
```

### PATCH /pools/{pool_id}
```
Authorization 필요 | Role: admin, accountant

Request:
{
  "reason": "입찰기일 국가 공휴일로 인한 변경",  // 필수, 빈 문자열 불가
  "bid_date": "2026-03-05",
  "status": "closed",
  // ... 기타 변경 필드
}

Response 200: PoolDetail
Error 422: reason 누락 또는 빈 문자열
```

### PoolDetail 스키마
```json
{
  "id": 1,
  "name": "PwC-SB 2026-2 Program",
  "status": "closed",
  // 거래 정보
  "cutoff_date": "2026-01-15",
  "bid_date": "2026-02-28",
  "closing_date": "2026-03-31",
  "sale_method": "제한적 경쟁입찰",
  "bidder_count": 5,
  // 거래 참여자
  "seller_companies": [{"name": "OO저축은행", "advisor": null}],
  "buyer_companies": [{"name": "OO F&I", "advisor": null, "checklist_ok": true}],
  // 담보
  "collateral_large": "무담보",
  "collateral_small": "CCRS&IRL",
  // 채권
  "debtor_type": ["개인", "개인사업자"],
  "debtor_count": 1200,
  "bond_count": 1350,
  "avg_overdue_months": 18.5,
  "opb": 88000000000,
  // 가격
  "sale_price": 61600000000,
  "sale_ratio": 0.7,              // GENERATED
  // 재매각
  "resale_included": false,
  "resale_debtor_count": null,
  "resale_bond_count": null,
  "resale_opb": null,
  // 기타
  "remarks": null,
  "files": {
    "invitation_letter": {"doc_id": 10, "file_name": "IL.pdf"},
    "bid_package":        {"doc_id": 11, "file_name": "Bid Package.zip"},
    "bid_submission":     {"doc_id": 12, "file_name": "입찰서류.zip"},
    "other":              {"doc_id": 13, "file_name": "기타자료.pdf"}
  }
}
```

---

## Documents (C3)

### GET /documents
```
Authorization 필요
Query: ?pool_id=1&role_type=seller&page=1&size=20

Response 200:
{
  "items": [
    {
      "id": 1,
      "pool_id": 1,
      "pool_name": "PwC-SB 2026-2 Program",
      "role_type": "seller",
      "company_name": "OO저축은행",      // 등록회사명
      "uploader_name": "홍길동",          // 등록자
      "file_name": "DataDisk.xlsx",
      "file_size": 5242880,
      "memo": null,
      "created_at": "2026-01-15T09:00:00Z"
    }
  ],
  "total": 5
}
```

### POST /documents/upload
```
Authorization 필요 | Role: role_type별 제한
Content-Type: multipart/form-data

Form:
  file     : File (필수)
  pool_id  : int (필수)
  role_type: "seller" | "buyer" | "accountant" (필수)
  memo     : string (선택)

Response 201:
{ "id": 1, "file_name": "DataDisk.xlsx", "file_size": 5242880, "created_at": "..." }

Error 400: 허용되지 않는 파일 형식
Error 403: role_type 업로드 권한 없음
Error 413: 500MB 초과
```

### GET /documents/{doc_id}/download
```
Authorization 필요

Response 200: StreamingResponse (application/octet-stream)
Headers: Content-Disposition: attachment; filename*=UTF-8''[원본파일명]

Error 403: 열람 권한 없음
Error 404: 파일 없음
```

### PATCH /documents/{doc_id}
```
Authorization 필요 | Role: 업로더 또는 admin, accountant

Request:
{
  "reason": "메모 오류 수정",   // 필수
  "memo": "수정된 메모 내용"
}
Response 200: DocumentItem
Error 422: reason 누락
```

---

## Notices (C1)

### GET /notices
```
Authorization 필요
Query: ?pool_id=1&page=1&size=20
(pool_id 없으면 전체 공지 포함)

Response 200:
{
  "items": [
    {
      "id": 1,
      "category": "PwC-SB 2026-1 Program",   // 구분
      "title": "입찰기일 변경 안내",
      "has_attachment": true,                  // 💾 아이콘 표시 여부
      "created_by_name": "홍길동",
      "created_at": "2026-01-15T09:00:00Z"
    }
  ],
  "total": 3
}
```

### GET /notices/{notice_id}
```
Response 200:
{
  "id": 1,
  "category": "PwC-SB 2026-1 Program",
  "title": "입찰기일 변경 안내",
  "content": "기존 입찰기일의 국가 공휴일 지정에 따라...",
  "attachment_doc_id": 5,           // null이면 첨부 없음
  "attachment_name": "수정 일정표.xlsx",
  "created_at": "2026-01-15T09:00:00Z"
}
```

### POST /notices
```
Role: admin, accountant
Content-Type: multipart/form-data

Form:
  pool_id : int (선택, null이면 전체 공지)
  category: string
  title   : string (필수)
  content : string
  file    : File (선택)

Response 201
```

---

## Consulting (B1/B2 → Z2)

### POST /consulting
```
Authorization 필요

Request:
{
  "type": "selling",     // "selling"(매각 상담) | "buying"(인수 상담)
  "title": "NPL 포트폴리오 매각 관련 문의",
  "content": "내용..."
}
Response 201: { "id": 1, "status": "pending" }
```

### GET /consulting
```
Authorization 필요
Query: ?page=1&size=20
Role seller/buyer → 본인 신청만
Role admin/accountant → 전체

Response 200:
{
  "items": [
    {
      "id": 1,
      "type": "selling",
      "title": "NPL 포트폴리오 매각 관련 문의",
      "status": "pending",
      "created_at": "2023-10-26T..."
    }
  ]
}
```

---

## Admin (Z1, Z2)

### GET /admin/users
```
Role: admin, accountant
Query: ?role=pending&page=1&size=20

Response 200:
{
  "items": [
    {
      "id": 1,
      "name": "김매도",
      "email": "seller_kim@pwc.com",
      "company_name": "A 저축은행",
      "department": "여신관리부",         // 담당부서명
      "title": "과장",
      "phone_office": "02-3781-3131",
      "phone_mobile": "010-3131-3131",
      "role": "seller",
      "is_verified": true,
      "last_login_ip": "210.111.88.66",   // 접속IP
      "created_at": "2026-01-15T..."
    }
  ],
  "total": 50
}
```

### PATCH /admin/users/{user_id}
```
Role: admin, accountant

Request:
{
  "reason": "신원 확인 완료",   // 필수
  "role": "seller",             // 역할 변경
  "is_verified": true           // 인증 처리
}
Response 200: UserDetail
Error 422: reason 누락
```

### DELETE /admin/users/{user_id}
```
Role: admin, accountant

Request Body:
{ "reason": "탈퇴 요청 처리" }   // 필수

Response 200: { "message": "삭제되었습니다." }
```

### POST /admin/users/{user_id}/reset-password
```
Role: admin, accountant

Response 200: { "temp_password": "Tmp@12345" }
// 임시 비밀번호를 화면에 표시 → 관리자가 직접 전달
```

### GET /admin/consulting
```
Role: admin, accountant
Query: ?type=selling&status=pending&page=1&size=20

Response 200:
{
  "items": [
    {
      "id": 1,
      "type": "selling",
      "title": "NPL 포트폴리오 매각 관련 문의",
      "user_name": "김매도",
      "company_name": "A 캐피탈",
      "status": "pending",
      "created_at": "2023-10-26T..."
    }
  ]
}
```

### POST /admin/consulting/{consulting_id}/reply
```
Role: admin, accountant

Request: { "reply": "답변 내용..." }
Response 200: { "id": 1, "status": "replied" }
```

---

## Users (마이페이지 Y)

### GET /users/me
```
Authorization 필요

Response 200:
{
  "id": 1,
  "name": "오민규",
  "email": "mingyu.oh@pwc.com",
  "department": "여신관리부",
  "title": "이사",
  "phone_office": "02-3781-9633",
  "phone_mobile": "010-9719-0514",
  "last_login_ip": "210.111.88.66",
  "is_verified": true,
  "company": {
    "name": "OO저축은행",
    "representative": "홍길동",
    "dept_phone": "02-3781-3131",
    "postal_code": null,
    "address": null
  }
}
```

---

## Glossary (D2)

### GET /glossary
```
(인증 선택)
Response 200:
{
  "items": [
    { "id": 1, "term": "NPL (Non-Performing Loan)", "definition": "금융기관의..." },
    ...
  ]
}
// sort_order 기준 정렬, 총 11개 seed
```
