# Frontend Agent — Next.js 14 + 포털 UI

## 역할
Next.js 14 App Router 기반 페이지, 컴포넌트, API 연동을 구현한다.
작업 전 반드시 참조: CLAUDE.md → context/api-contracts.md → context/security-policy.md

---

## 프로젝트 구조

```
frontend/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                    # A: 홈
│   │   ├── service/
│   │   │   ├── selling/page.tsx        # B1: 매각 자문 (매각 상담 신청 버튼 포함)
│   │   │   └── buying/page.tsx         # B2: 인수 자문 (인수 상담 신청 버튼 포함)
│   │   └── auth/
│   │       ├── login/page.tsx
│   │       └── register/page.tsx       # X: 회원가입
│   └── (authenticated)/
│       ├── layout.tsx                  # 인증 가드 (pending 차단)
│       ├── notices/
│       │   ├── page.tsx                # C1: 공지사항 목록
│       │   └── [id]/page.tsx           # C1: 공지 상세
│       ├── pools/
│       │   ├── page.tsx                # C2-1: Pool 목록
│       │   └── [id]/page.tsx           # C2-2: Pool 상세정보
│       ├── documents/
│       │   ├── seller/page.tsx         # C3-s: 거래자료 (매도인)
│       │   ├── buyer/page.tsx          # C3-b: 거래자료 (매수인)
│       │   └── accountant/page.tsx     # C3-a: 거래자료 (회계법인)
│       ├── support/
│       │   ├── guide/page.tsx          # D1: 이용가이드
│       │   ├── glossary/page.tsx       # D2: 용어사전
│       │   └── faq/page.tsx            # D3: FAQ
│       ├── mypage/page.tsx             # Y: 마이페이지
│       └── admin/
│           ├── users/page.tsx          # Z1: 회원 관리
│           └── consulting/page.tsx     # Z2: 상담 관리
├── components/
│   ├── ui/
│   │   └── ReasonModal.tsx             # 수정 사유 입력 공통 모달
│   ├── pools/
│   │   ├── PoolTable.tsx               # 15개 컬럼 테이블
│   │   ├── PoolStatusBadge.tsx         # 진행/종결/중단 배지
│   │   └── PoolDetailForm.tsx          # 6개 섹션 폼
│   ├── documents/
│   │   ├── FileUploadZone.tsx          # react-dropzone
│   │   └── DocumentTable.tsx           # No/Pool명/등록회사/등록자/파일명/💾/🗒️/날짜
│   ├── notices/
│   │   └── NoticeTable.tsx             # No/구분/제목/💾/등록일자
│   └── auth/
│       └── RoleGuard.tsx
├── lib/
│   ├── api.ts                          # axios + 401 자동 갱신
│   ├── auth.ts                         # Access Token 메모리 관리
│   └── rbac.ts                         # can(role, permission) 함수
├── hooks/
│   ├── usePools.ts
│   ├── useDocuments.ts
│   └── useNotices.ts
├── types/
│   └── index.ts
└── middleware.ts
```

---

## 핵심 패턴

### 1. 회원가입 폼 (X 페이지)
```typescript
// app/(public)/auth/register/page.tsx
// react-hook-form + zod 사용

const registerSchema = z.object({
  member_type: z.enum(["seller", "buyer", "accountant"]),
  name: z.string().min(1, "이름을 입력해주세요."),
  company_name: z.string().min(1, "회사명을 입력해주세요."),
  department: z.string().min(1, "담당부서명을 입력해주세요."),
  title: z.string().min(1, "직책을 입력해주세요."),
  phone_office: z.string().min(1, "회사전화를 입력해주세요."),
  phone_mobile: z.string().min(1, "휴대전화를 입력해주세요."),
  email: z.string().email("이메일 형식이 아닙니다."),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다."),
  password_confirm: z.string(),
  // 선택
  interests: z.array(z.enum(["담보", "무담보"])).default([]),
  // 약관
  terms_1: z.literal(true, { errorMap: () => ({ message: "약관에 동의해주세요." }) }),
  terms_2: z.literal(true, { errorMap: () => ({ message: "약관에 동의해주세요." }) }),
  terms_3: z.literal(true, { errorMap: () => ({ message: "약관에 동의해주세요." }) }),
}).refine(d => d.password === d.password_confirm, {
  message: "비밀번호가 일치하지 않습니다.",
  path: ["password_confirm"],
});
```

### 2. RBAC — can() 함수
```typescript
// lib/rbac.ts
export const PERMISSIONS = {
  "pool:write":                ["admin", "accountant"],
  "pool:read_detail":          ["admin", "accountant", "seller", "buyer"],
  "document:seller:write":     ["admin", "accountant", "seller"],
  "document:buyer:write":      ["admin", "accountant", "buyer"],
  "document:accountant:write": ["admin", "accountant"],
  "document:seller:read":      ["admin", "accountant", "seller"],
  "document:buyer:read":       ["admin", "accountant", "buyer"],
  "document:accountant:read":  ["admin", "accountant"],
  "notice:write":              ["admin", "accountant"],
  "admin:access":              ["admin", "accountant"],
  "consulting:reply":          ["admin", "accountant"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const can = (role: string, permission: Permission): boolean =>
  (PERMISSIONS[permission] as readonly string[]).includes(role);

// 사용 예시
{can(user.role, "pool:write") && (
  <Button onClick={() => setShowReasonModal(true)}>수정</Button>
)}
```

### 3. Pool 목록 테이블 (C2-1)
```typescript
// components/pools/PoolTable.tsx
// 정렬: 진행 → 종결 → 중단 (STATUS_ORDER 상수 사용)
// 미공개 필드: null이면 "—" 표시

const STATUS_ORDER = { active: 0, closed: 1, cancelled: 2 };

interface PoolRow {
  id: number;
  status: "active" | "closed" | "cancelled";
  name: string;
  collateral_large: string | null;  // null = 미공개
  collateral_small: string | null;
  cutoff_date: string | null;
  bid_date: string | null;
  closing_date: string | null;
  seller_name: string | null;
  buyer_name: string | null;
  opb: number | null;
  sale_price: number | null;
  sale_ratio: number | null;
  remarks: string | null;
  can_view_detail: boolean;         // 상세보기 활성화 여부
}

// 상세보기: can_view_detail=true이고 status=closed인 경우만 링크 활성화
```

### 4. Pool 상세정보 폼 섹션 (C2-2)
```typescript
// components/pools/PoolDetailForm.tsx
// 6개 섹션을 아코디언 또는 탭으로 구성

const SECTIONS = [
  { key: "deal", label: "거래 정보" },
  { key: "parties", label: "거래 참여자 정보" },
  { key: "collateral", label: "담보 정보" },
  { key: "bond", label: "채권 정보" },
  { key: "price", label: "가격 정보" },
  { key: "resale", label: "재매각 정보" },
  { key: "etc", label: "기타" },
];

// 담보유형(소) 선택지 — 담보유형(대) 값에 따라 동적 변경
const COLLATERAL_SMALL = {
  담보: ["Regular", "Special"],
  무담보: ["CCRS&IRL", "일반무담보", "기타"],
};

// 매각가율 = sale_price / opb 자동 계산 (입력 비활성화)
// 기타 섹션: 파일 다운로드 버튼 4개 (IL, Bid Package, 입찰서류, 기타)
```

### 5. 거래자료 테이블 (C3 공통)
```typescript
// components/documents/DocumentTable.tsx
// 컬럼: No, Pool명, 등록회사명, 등록자, 파일명, 파일다운(💾), Memo(🗒️), 등록일
// Pool명: 드롭다운 필터

interface DocumentRow {
  id: number;
  pool_name: string;
  company_name: string;    // 등록회사명 (자동)
  uploader_name: string;   // 등록자 (자동)
  file_name: string;
  memo: string | null;
  created_at: string;
}
```

### 6. 마이페이지 (Y)
```typescript
// app/(authenticated)/mypage/page.tsx

// 가입회사 정보 (6개 필드 2단 레이아웃)
interface CompanyInfo {
  company_name: string;
  representative: string;        // 대표자
  dept_phone: string;            // 담당부서 대표전화
  department: string;            // 담당부서명
  postal_code: string;           // 우편번호
  address: string;               // 주소
}

// 사용자 정보 (8개 필드 2단 레이아웃)
interface UserInfo {
  name: string;                  // 성명
  department: string;            // 소속부점
  title: string;                 // 직책
  phone_office: string;          // 회사전화
  phone_mobile: string;          // 휴대전화
  email: string;                 // 이메일
  last_login_ip: string;         // 접속IP
  is_verified: boolean;          // 인증여부 (O/X)
}
```

### 7. 회원 관리 테이블 (Z1)
```typescript
// 13개 컬럼: No, 회원유형, 이름, 회사명, 담당부서명, 직책,
//           회사전화, 휴대전화, 아이디, 접속IP, 가입일, 인증상태, 관리([수정]/[삭제])
// [수정] 클릭 → ReasonModal → PATCH /admin/users/{id}
// 인증상태: Y(초록 배지) / N(노란 배지)
```

### 8. 상담 관리 테이블 (Z2)
```typescript
// 8개 컬럼: No, 상담유형, 이름, 회사명, 제목, 신청일, 처리상태, 관리
// 처리상태: "답변 대기"(노란 배지) / "답변 완료"(초록 배지)
// [답글 작성] 클릭 → 답글 입력 모달 → POST /admin/consulting/{id}/reply
// [답변 보기] 클릭 → 기존 답변 확인 모달
```

### 9. ReasonModal (수정 사유 공통)
```typescript
// components/ui/ReasonModal.tsx
// PATCH 전 반드시 거쳐야 하는 공통 모달
export function ReasonModal({
  isOpen, onConfirm, onCancel, title = "수정 사유 입력"
}: ReasonModalProps) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={isOpen}>
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <Textarea
        placeholder="수정 사유를 입력해주세요. (필수)"
        value={reason}
        onChange={e => setReason(e.target.value)}
      />
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>취소</Button>
        <Button disabled={!reason.trim()} onClick={() => onConfirm(reason)}>확인</Button>
      </DialogFooter>
    </Dialog>
  );
}
```

---

## Pool 상태 배지 색상

```typescript
const STATUS_STYLE: Record<string, string> = {
  active:    "bg-blue-100 text-blue-800",   // 진행
  closed:    "bg-gray-100 text-gray-600",   // 종결
  cancelled: "bg-red-100 text-red-600",     // 중단/유찰
};
```

---

## 렌더링 전략

| 페이지 | 방식 | 이유 |
|---|---|---|
| 홈, 서비스 소개 | 서버 컴포넌트 | SEO |
| Pool 목록 | 서버 컴포넌트 + revalidate | 초기 로드 속도 |
| Pool 상세, 거래자료 | 클라이언트 | 권한 분기 복잡 |
| 마이페이지, 관리자 | 클라이언트 | 빈번한 상태 변경 |

---

## 금지 사항

- [ ] 파일 서버 경로 직접 렌더링 (다운로드는 /api/v1/documents/{id}/download)
- [ ] 클라이언트만의 role 검사 (서버 검증과 병행)
- [ ] Access Token localStorage 저장 (XSS 취약)
- [ ] use client 남발 (서버 컴포넌트 기본)
- [ ] role 체크 없는 관리자 UI 렌더링
