# 변경요청 설계 문서 — v1.1

> 작성일: 2026-03
> 기준: 1차 개발 완료 후 클라이언트 피드백
> 문서 목적: 개발 AI에게 전달할 구현 지침. 우선순위·난이도·영향 범위를 포함.

---

## 변경요청 분류 요약

| ID | 위치 | 유형 | 난이도 | 우선순위 |
|----|------|------|--------|----------|
| CR-01 | DB 신규 | DataDisk 채권 DB + CSV Import | ★★★★☆ | High |
| CR-02 | 거래현황 상세 | 채권 요약 페이지 (성격별 채권정보) | ★★★☆☆ | High |
| CR-04 | 공지사항 | 게시물 수정 기능 | ★☆☆☆☆ | High |
| CR-05 | 공지 등록 | 복수 파일 첨부 | ★★☆☆☆ | High |
| CR-06 | 공지 등록 | Pool명 Dropdown 선택 | ★☆☆☆☆ | High |
| CR-07 | 자료등록 | 복수 파일 업로드 + 확인 버튼 후 업로드 | ★★☆☆☆ | High |
| CR-08 | 자료등록 | 파일 수정·삭제 기능 | ★☆☆☆☆ | High |
| CR-09 | 거래현황 | 필터 기능 (Pool명/양도인/기간) | ★★☆☆☆ | Medium |
| CR-10 | 거래현황 | Pool별 접속 권한 설정 | ★★★☆☆ | Medium |
| CR-11 | 거래현황 상세 | Pool 상세 내 파일 업로드 + 자료등록 연동 | ★★☆☆☆ | Medium |
| CR-12 | 거래현황 상세 | 담보유형(대·소) 복수 선택 (Checkbox) | ★★☆☆☆ | Medium |
| CR-13 | 관리자 - 상담관리 | 답변 등록 버그 수정 | ★☆☆☆☆ | Critical |

---

## 난이도 기준

```
★☆☆☆☆  1~2일  — 기존 코드 수정, 간단한 UI 변경
★★☆☆☆  3~5일  — 새 컴포넌트 + 간단한 API 추가
★★★☆☆  1~2주  — 새 도메인 모델 + API + 페이지
★★★★☆  2~4주  — 대형 신규 기능, 파싱 로직 + 다중 뷰
```

---

## CR-13 — 상담 관리 답변 등록 버그 (Critical)

> 먼저 수정. 현재 운영 중인 기능이 작동하지 않는 버그.

### 증상
`POST /api/v1/admin/consulting/{id}/reply` 호출 시 "답변 등록에 실패했습니다." 표시.

### 원인 후보 (우선순위 순)

```
1. API 라우터 미등록
   main.py에 admin 라우터가 include_router 되지 않았을 가능성
   → grep -n "admin" backend/app/main.py

2. 인증 의존성 오류
   require_role(["admin","accountant"]) 내부에서 예외 발생
   → 브라우저 DevTools → Network → 응답 status code 확인 (401/403/422/500)

3. consulting.replied_by FK 오류
   replied_by 컬럼이 NOT NULL로 설정되어 있으나 current_user.id 미전달
   → backend/app/models/consulting.py 확인

4. Pydantic 스키마 불일치
   request body {"reply": "..."} vs 스키마 필드명 상이
   → backend/app/schemas/consulting.py 확인
```

### 수정 절차

```
1. 브라우저 DevTools → Network 탭에서 실제 응답 status code 확인
2. 상태 코드별 대응:
   401 → 토큰 미전송. lib/api.ts Authorization 헤더 확인
   403 → require_role 역할 목록 확인. ["admin","accountant"] 정확히 기재됐는지
   422 → request body 필드명 확인. "reply" vs "content" 등
   500 → backend 로그 확인. replied_by NOT NULL 제약 위반 가능성
3. 수정 후 pytest tests/test_consulting.py -v 재실행
```

---

## CR-04 — 공지사항 게시물 수정 기능 (★☆☆☆☆)

### 현황
공지 상세 페이지에 [수정] 버튼이 없거나 동작하지 않음.

### 구현 사항

**Backend** — 이미 PATCH /notices/{id} 엔드포인트 존재 여부 확인:
```python
# 없으면 추가
@router.patch("/{notice_id}", dependencies=[Depends(require_role(["admin","accountant"]))])
async def update_notice(notice_id: int, data: NoticeUpdate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    # reason 필수 검증
    # audit_log 기록
```

**Frontend** — `app/(authenticated)/notices/[id]/page.tsx`:
```
accountant/admin 역할일 때만 표시:
  [수정] secondary 버튼 → NoticeEditModal 오픈
  [삭제] danger 버튼   → ReasonModal → DELETE /notices/{id}

NoticeEditModal (components/notices/NoticeEditModal.tsx):
  - 기존 데이터 pre-fill (category, title, content, 첨부파일)
  - 제출 전 ReasonModal로 수정 사유 입력
  - PATCH /notices/{id} 호출
  - 성공 → toast.success("공지가 수정되었습니다.") → 페이지 revalidate
```

---

## CR-05 — 공지 등록: 복수 파일 첨부 (★★☆☆☆)

### 현황
공지 등록 시 파일을 1개만 첨부 가능.

### DB 변경
```sql
-- notices 테이블: 단일 파일 컬럼 → notice_files 별도 테이블로 분리

CREATE TABLE notice_files (
  id           SERIAL PRIMARY KEY,
  notice_id    INT NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  file_name    VARCHAR(500) NOT NULL,
  file_path_enc TEXT NOT NULL,
  file_size    BIGINT,
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- notices 테이블에서 기존 file_name, file_path_enc 컬럼 유지 (하위호환)
-- 단, 신규 등록은 notice_files 테이블 사용
-- alembic migration 필요
```

### Backend 변경

```python
# schemas/notice.py
class NoticeFileResponse(BaseModel):
    id: int
    file_name: str
    file_size: int | None

class NoticeDetail(BaseModel):
    ...
    files: list[NoticeFileResponse]  # 단일 attachment → 복수로 변경

# services/notice.py
async def create_notice(db, data, files: list[UploadFile], current_user):
    # 1. notice 레코드 생성
    # 2. files 순회 → file_validator → file_storage.upload() → notice_files INSERT
    # 파일이 0개여도 정상 처리

# routers/notices.py
@router.post("/")
async def create_notice(
    pool_id: int | None = Form(None),
    category: str = Form(...),
    title: str = Form(...),
    content: str = Form(...),
    files: list[UploadFile] = File(default=[])  # 복수 파일
):
```

### Frontend 변경

```typescript
// components/notices/NoticeCreateModal.tsx
// Input type="file" → multiple 속성 추가
<input
  type="file"
  multiple                              // ← 추가
  accept=".pdf,.xlsx,.docx,.zip,.hwp"
  onChange={handleFileChange}
/>

// 선택된 파일 목록 미리보기
{selectedFiles.map((file, i) => (
  <div key={i} className="flex items-center justify-between py-1 text-body-sm">
    <span className="text-[#464646]">{file.name}</span>
    <button onClick={() => removeFile(i)}
      className="text-[#E0301E] text-caption">제거</button>
  </div>
))}

// 제출: FormData에 files 복수 append
files.forEach(file => formData.append('files', file))
```

---

## CR-06 — 공지 등록: Pool명 Dropdown 선택 (★☆☆☆☆)

### 현황
Pool명을 수기 입력하고 있음. 등록된 Pool 목록에서 선택하도록 변경.

### 구현 사항

**등록 폼 구성 (순서 포함):**
```
1. 구분       — Input (수기 기재)
2. Pool명     — Dropdown (등록된 Pool List + "전체 공지" 옵션)
3. 제목       — Input (수기 기재)
4. 내용       — Textarea
5. 첨부파일   — 복수 파일 (CR-05 적용)
```

**Frontend:**
```typescript
// NoticeCreateModal 내 Pool 목록 로드
const { data: pools } = useQuery({
  queryKey: ['pools-for-select'],
  queryFn: () => api.get('/pools?status=active&size=100'),  // 진행 중 Pool만
})

// Select 컴포넌트
<select name="pool_id" className="...">
  <option value="">전체 공지 (특정 Pool 미지정)</option>
  {pools?.items.map(pool => (
    <option key={pool.id} value={pool.id}>{pool.name}</option>
  ))}
</select>
```

**Backend:**
```python
# GET /pools?status=active&size=100 — 이미 존재하는 엔드포인트 활용
# pool_id=null → 전체 공지, pool_id=N → 해당 Pool 공지
# 기존 로직 변경 없음
```

---

## CR-07 — 자료등록: 복수 파일 + 확인 버튼 업로드 (★★☆☆☆)

### 현황
1. 파일 1개만 업로드 가능
2. 드래그 후 즉시 업로드 (확인 버튼 없음)

### 변경 흐름
```
현재: 파일 드래그 → 즉시 POST /documents/upload
변경: 파일 드래그 or 선택 → 대기 목록에 추가 → [업로드] 버튼 클릭 → POST
```

### Frontend 변경 (`components/documents/FileUploadZone.tsx`)

```typescript
// State 구조
const [stagedFiles, setStagedFiles] = useState<File[]>([])   // 대기 목록
const [uploading, setUploading] = useState(false)

// 드래그 or 파일 선택 → stagedFiles에 추가 (업로드 X)
const onDrop = (acceptedFiles: File[]) => {
  setStagedFiles(prev => [...prev, ...acceptedFiles])
}

// 대기 목록 UI
<div className="mt-4 space-y-2">
  {stagedFiles.map((file, i) => (
    <div key={i} className="flex items-center justify-between
                             border border-[#DEDEDE] rounded px-4 py-2">
      <span className="text-body-sm text-[#464646]">{file.name}</span>
      <span className="text-caption text-[#7D7D7D]">
        {(file.size / 1024 / 1024).toFixed(1)} MB
      </span>
      <button onClick={() => removeStaged(i)}
        className="text-[#E0301E] text-caption ml-4">제거</button>
    </div>
  ))}
</div>

// [업로드] 버튼 — stagedFiles.length > 0 일 때만 활성화
<button
  onClick={handleUpload}
  disabled={stagedFiles.length === 0 || uploading}
  className="mt-4 px-6 py-2 bg-[#D04A02] text-white rounded
             disabled:opacity-40 disabled:cursor-not-allowed">
  {uploading ? '업로드 중...' : `업로드 (${stagedFiles.length}개)`}
</button>

// handleUpload: 파일별 순차 업로드 or FormData에 일괄 append
const handleUpload = async () => {
  setUploading(true)
  for (const file of stagedFiles) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('pool_id', selectedPoolId)
    await api.post('/documents/upload', formData)
  }
  setStagedFiles([])
  setUploading(false)
  toast.success(`${stagedFiles.length}개 파일이 업로드되었습니다.`)
  queryClient.invalidateQueries({ queryKey: ['documents'] })
}
```

---

## CR-08 — 자료등록: 파일 수정·삭제 (★☆☆☆☆)

### 현황
업로드된 파일에 수정·삭제 기능 없음.

### Backend

```python
# PATCH /documents/{id} — 메모 수정 (파일 자체 교체는 불가, 재업로드 방식)
@router.patch("/{doc_id}", dependencies=[Depends(get_current_user)])
async def update_document_memo(doc_id: int, data: DocumentMemoUpdate, ...):
    # data: { memo: str, reason: str }
    # audit_log 기록

# DELETE /documents/{id}
@router.delete("/{doc_id}", dependencies=[Depends(get_current_user)])
async def delete_document(doc_id: int, body: ReasonBody, ...):
    # 본인 업로드 or accountant/admin만 삭제 가능
    # file_storage.delete(doc.file_path_enc) 호출
    # DB 레코드 삭제
    # audit_log 기록
```

### Frontend (`components/documents/DocumentTable.tsx`)

```
각 행 우측에 액션 버튼 추가:
  [🗒️ 메모수정]  → memo 수정 인라인 or 소형 모달
  [🗑️ 삭제]      → ReasonModal → DELETE /documents/{id}

삭제 권한:
  - 본인이 업로드한 파일: 항상 가능
  - 타인 업로드 파일: accountant/admin만 가능
  → lib/rbac.ts can("document:delete:others", user.role) 추가
```

---

## CR-09 — 거래현황: 필터 기능 (★★☆☆☆)

### 현황
Pool 목록에 필터 없음. 전체 목록만 표시.

### 필터 항목
- Pool명: 텍스트 검색 (부분 일치)
- 양도인명: 텍스트 검색
- 기간: 자산확정일 범위 (날짜 From~To)

### Backend

```python
# GET /pools — query params 추가
@router.get("/")
async def get_pools(
    name: str | None = Query(None),          # Pool명 부분 일치
    seller_name: str | None = Query(None),   # 양도인명 (pool_companies.role='seller')
    cutoff_from: date | None = Query(None),  # 자산확정일 시작
    cutoff_to: date | None = Query(None),    # 자산확정일 종료
    status: str | None = Query(None),        # active | closed | cancelled
    page: int = Query(1),
    size: int = Query(20),
    ...
):
    # repositories/pool.py get_all()에 필터 조건 추가
    # seller_name 필터: pool_companies JOIN, role='seller', companies.name ILIKE
    # name 필터: pools.name ILIKE %name%
    # 날짜 필터: cutoff_date BETWEEN cutoff_from AND cutoff_to
```

### Frontend (`app/(authenticated)/pools/page.tsx`)

```typescript
// 필터 바 UI — 테이블 상단
<div className="flex flex-wrap gap-3 mb-4 p-4 bg-[#F5F5F5] rounded border border-[#DEDEDE]">

  {/* Pool명 검색 */}
  <Input
    placeholder="Pool명 검색"
    value={filters.name}
    onChange={e => setFilters(f => ({...f, name: e.target.value}))}
    className="w-48"
  />

  {/* 양도인 검색 */}
  <Input
    placeholder="양도인명 검색"
    value={filters.sellerName}
    onChange={e => setFilters(f => ({...f, sellerName: e.target.value}))}
    className="w-48"
  />

  {/* 자산확정일 범위 */}
  <input type="date" value={filters.cutoffFrom}
    onChange={e => setFilters(f => ({...f, cutoffFrom: e.target.value}))}
    className="border border-[#DEDEDE] rounded px-3 py-2 text-body-sm" />
  <span className="self-center text-body-sm text-[#7D7D7D]">~</span>
  <input type="date" value={filters.cutoffTo}
    onChange={e => setFilters(f => ({...f, cutoffTo: e.target.value}))}
    className="border border-[#DEDEDE] rounded px-3 py-2 text-body-sm" />

  {/* 초기화 */}
  <button onClick={resetFilters}
    className="px-4 py-2 border border-[#DEDEDE] rounded text-body-sm
               text-[#7D7D7D] hover:border-[#D04A02] hover:text-[#D04A02]">
    초기화
  </button>
</div>

// usePools hook에 filters state를 query params로 전달
// debounce 300ms 적용 (텍스트 입력 시 불필요한 API 호출 방지)
```

---

## CR-10 — 거래현황: Pool별 접속 권한 설정 (★★★☆☆)

### 요구사항
```
진행 중(active) Pool → 회계법인(accountant/admin) + 해당 양도인 + 등록된 투자자 Group만 열람
종결(closed) Pool    → 회계법인 + 양도인 + 양수인만 열람
```

### 현재 구조와의 차이
```
현재: active Pool = 전체 로그인 사용자 열람 가능 (미공개 필드 4개만 마스킹)
변경: active Pool = pool_participants에 등록된 company 소속 사용자만 열람 가능
```

### DB 변경 없음
기존 `pool_participants`, `pool_companies` 테이블로 구현 가능.

### Backend 변경

```python
# services/pool.py — get_pool_detail() 권한 로직 변경

async def check_pool_access(db, pool_id, current_user) -> bool:
    """Pool 상세 열람 권한 검증"""
    pool = await repo.get_or_404(db, pool_id)

    # accountant/admin: 항상 접근 가능
    if current_user.role in ["admin", "accountant"]:
        return True

    # active Pool: pool_participants에 등록된 company만
    if pool.status == "active":
        is_participant = await repo.check_participation(
            db, pool_id, current_user.company_id
        )
        # pool_companies(양도인)도 포함
        is_seller = await repo.check_pool_company(
            db, pool_id, current_user.company_id, role="seller"
        )
        return is_participant or is_seller

    # closed Pool: pool_companies (seller + buyer) + pool_participants
    if pool.status == "closed":
        return await repo.check_pool_company_or_participant(
            db, pool_id, current_user.company_id
        )

    # cancelled: 회계법인만 (이미 위에서 처리됨)
    return False

# GET /pools/{id} 에서 check_pool_access 호출
# False → HTTPException(403, "이 Pool에 대한 접근 권한이 없습니다.")
```

### Frontend 변경

```typescript
// 목록 페이지(C2-1): 권한 없는 Pool은 행을 회색으로 표시 + "접근 제한" 배지
// 상세 페이지(C2-2): 403 응답 시 "접근 권한이 없습니다." 안내 컴포넌트 표시

// 관리자(Z1): Pool별 참여 업체 관리 UI 필요
// app/(authenticated)/admin/pool-access/page.tsx (신규)
//   - Pool 선택 → 현재 참여 업체 목록 표시
//   - [업체 추가] → 등록된 company 목록에서 선택
//   - [제거] → pool_participants 삭제
```

### 관리자 Pool 접근 관리 페이지 신규

```
경로: /admin/pool-access
메뉴: 관리자 → Pool 접근 관리 (신규)
기능:
  1. Pool 선택 Dropdown
  2. 현재 참여 업체 테이블 (company명, 역할, 등록일, [제거])
  3. [업체 추가] 버튼 → 등록된 companies 목록 modal → 선택 → pool_participants INSERT

API 추가:
  GET  /admin/pools/{pool_id}/participants       → 참여 업체 목록
  POST /admin/pools/{pool_id}/participants       → 업체 추가 { company_id }
  DELETE /admin/pools/{pool_id}/participants/{company_id}  → 업체 제거
```

---

## CR-11 — 거래현황 상세: Pool 내 파일 업로드 + 자료등록 연동 (★★☆☆☆)

### 요구사항
1. Pool 상세 페이지에서 직접 파일 업로드 가능
2. 자료등록 게시판에 올린 파일을 Pool 상세에 선택적으로 링크

### 구현 방향: documents 테이블 활용 (신규 테이블 불필요)

```
방안: Pool 상세의 "거래 자료" 탭에서 documents 테이블을 pool_id로 필터링하여 표시.
      업로드 시 pool_id를 해당 Pool로 자동 지정.
      자료등록 게시판과 동일한 데이터, 다른 뷰.
```

### Frontend 변경 (`app/(authenticated)/pools/[id]/page.tsx`)

```typescript
// Pool 상세 페이지에 탭 추가
// 기존: 거래 정보 단일 뷰
// 변경: [거래 정보] | [거래 자료] | [채권 정보] (CR-02 연동) 탭

// [거래 자료] 탭 내용
<DocumentSection poolId={poolId} />

// DocumentSection: 자료등록 게시판과 동일한 DocumentTable 재사용
// + 상단에 소형 FileUploadZone (pool_id 고정)
// accountant/admin + 해당 Pool 참여자만 업로드 가능
```

### 자료등록 게시판 → Pool 상세 링크 연동

```
별도 링크 테이블 불필요.
documents.pool_id로 이미 연결되어 있음.
자료등록에서 올린 파일 = Pool 상세 [거래 자료] 탭에서도 동일하게 보임.
"선택적 링크" 구현:
  documents 테이블에 is_pool_visible BOOLEAN DEFAULT TRUE 컬럼 추가
  자료등록 게시판에서 업로드 시 기본 TRUE
  관리자가 특정 파일을 Pool 상세에서 숨기려면 FALSE로 토글 가능
```

---

## CR-12 — 담보유형(대·소) 복수 선택 (★★☆☆☆)

### 현황
pools.collateral_large: VARCHAR(20) 단일값 → "담보" or "무담보"
pools.collateral_small: VARCHAR(50) 단일값 → "Regular" 등

### 변경

```sql
-- DB: 단일 VARCHAR → TEXT[] 배열로 변경
ALTER TABLE pools
  ALTER COLUMN collateral_large TYPE TEXT[],   -- ['담보','무담보'] 복수 허용
  ALTER COLUMN collateral_small TYPE TEXT[];   -- ['Regular','Special'] 복수 허용

-- Alembic migration 필요 (기존 데이터 변환 포함)
-- UPDATE pools SET collateral_large = ARRAY[collateral_large] WHERE collateral_large IS NOT NULL;
```

```python
# schemas/pool.py
class PoolCreateSchema(BaseModel):
    collateral_large: list[str] = []  # ["담보","무담보"]
    collateral_small: list[str] = []  # ["Regular","Special","CCRS&IRL"]
```

```typescript
// PoolDetailForm.tsx — 담보유형 섹션 수정
// 단일 Select → Checkbox 그룹으로 변경

const COLLATERAL_LARGE = ["담보", "무담보"]
const COLLATERAL_SMALL = ["Regular", "Special", "CCRS&IRL", "일반무담보", "기타"]

// 담보유형(대) Checkbox 그룹
<fieldset>
  <legend className="text-body-sm font-semibold text-[#464646] mb-2">담보유형(대)</legend>
  {COLLATERAL_LARGE.map(opt => (
    <label key={opt} className="flex items-center gap-2 text-body-sm">
      <input type="checkbox"
        checked={form.collateral_large.includes(opt)}
        onChange={() => toggleCollateralLarge(opt)}
        className="accent-[#D04A02]"
      />
      {opt}
    </label>
  ))}
</fieldset>

// 담보유형(소) Checkbox 그룹 — 동일 패턴
```

---


## CR-01 — DataDisk 채권 DB 구축 (★★★★☆)

### 요구사항 분석
> 매도인 제시 → 회계법인 배포용 수정 DataDisk 기준으로 채권 정보를 DB화하고 웹에서 조회.
> 관리자가 엑셀(CSV) 일괄 업로드 가능. 특정 Record/Field 수정·삭제 가능.

### DB 설계 (신규 테이블 2개)

```sql
-- 채권 마스터 테이블
CREATE TABLE bonds (
  id                SERIAL PRIMARY KEY,
  pool_id           INT NOT NULL REFERENCES pools(id) ON DELETE CASCADE,

  -- 채권 식별
  bond_no           VARCHAR(100),           -- 채권번호 (DataDisk 원본 ID)
  debtor_type       VARCHAR(50),            -- 차주구분 (개인/개인사업자/법인)
  debtor_id_masked  VARCHAR(50),            -- 차주 식별자 (비식별화)

  -- 채권 정보
  creditor          VARCHAR(200),           -- 원채권자 (양도인)
  product_type      VARCHAR(100),           -- 상품유형 (신용대출/카드론/담보대출 등)
  collateral_type   VARCHAR(100),           -- 담보유형
  collateral_address TEXT,                  -- 담보물 주소

  -- 금액 정보
  original_amount   BIGINT,                 -- 최초 대출금액
  opb               BIGINT,                 -- 원금잔액 (OPB)
  interest_balance  BIGINT,                 -- 이자잔액
  total_balance     BIGINT,                 -- 합계잔액

  -- 연체 정보
  overdue_start_date DATE,                  -- 연체 시작일
  overdue_months    NUMERIC(5,1),           -- 연체 기간(개월)
  legal_status      VARCHAR(100),           -- 법적 상태 (소송/경매/없음 등)

  -- 메타
  import_batch      VARCHAR(100),           -- CSV 업로드 배치 ID
  created_by        INT REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ,
  is_deleted        BOOLEAN DEFAULT FALSE   -- soft delete
);

-- CSV 업로드 이력
CREATE TABLE bond_import_logs (
  id          SERIAL PRIMARY KEY,
  pool_id     INT NOT NULL REFERENCES pools(id),
  file_name   VARCHAR(500) NOT NULL,
  row_count   INT,
  success_count INT,
  error_count INT,
  errors      JSONB,                        -- [{row: 3, message: "OPB 값 오류"}, ...]
  imported_by INT REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_bonds_pool_id ON bonds(pool_id);
CREATE INDEX idx_bonds_debtor_type ON bonds(debtor_type);
CREATE INDEX idx_bonds_collateral_type ON bonds(collateral_type);
```

### DB 기술 스택 질문 응답
> "(1) MySQL을 활용하게 되는건가요?"
> → 현재 플랫폼은 **PostgreSQL 16** 기반입니다. MySQL 변경은 불필요합니다.
>   PostgreSQL은 TEXT[] 배열, JSONB, GENERATED STORED 컬럼 등 MySQL보다
>   이 프로젝트에 유리한 기능을 지원합니다.

### Backend

```python
# schemas/bond.py
class BondResponse(BaseModel):
    id: int
    bond_no: str | None
    debtor_type: str | None
    product_type: str | None
    collateral_type: str | None
    opb: int | None
    total_balance: int | None
    overdue_months: float | None
    legal_status: str | None

class BondImportResult(BaseModel):
    success_count: int
    error_count: int
    errors: list[dict]

# routers/bonds.py
GET    /bonds?pool_id=1&page=1&size=50          # Pool별 채권 목록
POST   /bonds/import                            # CSV 일괄 업로드 (admin/accountant)
PATCH  /bonds/{bond_id}                         # 단건 수정 (reason 필수)
DELETE /bonds/{bond_id}                         # 단건 삭제 (soft delete, reason 필수)
GET    /bonds/summary?pool_id=1                 # 성격별 요약 (CR-02)
```

### CSV 파싱 로직

```python
# services/bond_import.py
import pandas as pd

COLUMN_MAP = {
    "채권번호": "bond_no",
    "차주구분": "debtor_type",
    "상품유형": "product_type",
    "담보유형": "collateral_type",
    "담보물주소": "collateral_address",
    "최초대출금액": "original_amount",
    "원금잔액": "opb",
    "이자잔액": "interest_balance",
    "합계잔액": "total_balance",
    "연체시작일": "overdue_start_date",
    "연체기간(월)": "overdue_months",
    "법적상태": "legal_status",
}

async def import_bonds_from_csv(db, pool_id, file: UploadFile, current_user):
    df = pd.read_csv(file.file, encoding="utf-8-sig")  # BOM 처리
    # 컬럼명 매핑
    df = df.rename(columns=COLUMN_MAP)
    # 유효성 검사: opb 숫자 여부, 필수 컬럼 존재 여부
    errors = []
    success_count = 0
    batch_id = f"import_{pool_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    for i, row in df.iterrows():
        try:
            bond = Bond(pool_id=pool_id, import_batch=batch_id, **row.to_dict())
            db.add(bond)
            success_count += 1
        except Exception as e:
            errors.append({"row": i + 2, "message": str(e)})
    await db.commit()
    # bond_import_logs INSERT
    return BondImportResult(success_count=success_count, error_count=len(errors), errors=errors)
```

### Frontend

```typescript
// app/(authenticated)/admin/bonds/page.tsx (신규 — 채권 관리 페이지)
// - Pool 선택 Dropdown
// - CSV 업로드 영역 (drag & drop)
// - 업로드 이력 (bond_import_logs)
// - 채권 목록 테이블 (페이지네이션, 컬럼 정렬)
// - 행 클릭 → 인라인 편집 or 편집 모달

// 관리자 메뉴에 "채권 관리" 항목 추가
```

---

## CR-02 — 성격별 채권정보 요약 페이지 (★★★☆☆)

> CR-01 완료 후 진행.

### 요구사항
Pool 상세 내 "성격별 채권정보" 링크 → 채권을 성격별로 집계한 요약 뷰 표시.

### 요약 집계 항목

```python
# GET /bonds/summary?pool_id=1
# 아래 집계를 단일 쿼리로 반환

{
  "total": {
    "bond_count": 1250,
    "debtor_count": 980,
    "opb": 15000000000,        # 150억
    "total_balance": 18500000000
  },
  "by_debtor_type": [          # 차주구분별
    {"type": "개인", "bond_count": 800, "opb": 9000000000},
    {"type": "개인사업자", "bond_count": 300, "opb": 4000000000},
    {"type": "법인", "bond_count": 150, "opb": 2000000000}
  ],
  "by_product_type": [...],    # 상품유형별
  "by_collateral_type": [...], # 담보유형별
  "by_legal_status": [...],    # 법적상태별
  "by_overdue_range": [        # 연체기간 구간별
    {"range": "0~12개월",  "bond_count": 200, "opb": 2000000000},
    {"range": "12~24개월", "bond_count": 350, "opb": 4500000000},
    {"range": "24개월 이상","bond_count": 700, "opb": 8500000000}
  ]
}
```

### Frontend

```typescript
// app/(authenticated)/pools/[id]/bonds/page.tsx (신규)
// Pool 상세 [채권 정보] 탭 → 이 페이지로 이동

// 레이아웃: 요약 카드 + 집계 테이블
// 상단: 총 채권수 / 총 OPB / 총 합계잔액 카드 3개
// 중단: 성격별 집계 테이블 (차주구분 / 상품유형 / 담보유형 탭 전환)
//       각 테이블: 구분 | 채권수 | 비율(%) | OPB | OPB비율(%)
// 하단: 연체기간 구간별 바 차트 (recharts BarChart)
//       또는 단순 테이블 (차트 구현 부담 시)

// 접근 권한: Pool 상세와 동일한 권한 체계 적용 (CR-10)
```

---

## 구현 순서 권고

```
Week 1 (즉시):
  CR-13  상담 답변 버그 수정        ← 운영 중인 기능 버그, 최우선
  CR-04  공지사항 수정 기능
  CR-06  공지 Pool명 Dropdown

Week 2:
  CR-05  공지 복수 파일 첨부
  CR-07  자료등록 복수+확인 버튼
  CR-08  자료등록 수정·삭제

Week 3:
  CR-09  거래현황 필터
  CR-12  담보유형 복수 선택 (Checkbox)
  CR-11  Pool 상세 파일 업로드 연동

Week 4~5:
  CR-10  Pool별 접속 권한 (DB 변경 없지만 로직 복잡)

Week 6~8:
  CR-01  DataDisk 채권 DB (설계+파싱+관리 UI)
  CR-02  성격별 채권 요약 페이지 (CR-01 완료 후)
```

---

## 파일 참조 가이드 (Claude Code 호출 시)

```
공통 참조:
  .claude/CLAUDE.md
  .claude/context/domain-model.md
  .claude/context/api-contracts.md

CR-01, CR-02 (채권 DB):
  .claude/agents/backend.md
  .claude/skills/file-upload.md
  .claude/skills/audit-log.md

CR-05, CR-07, CR-08 (파일 업로드):
  .claude/skills/file-upload.md
  .claude/agents/frontend.md

CR-10 (Pool 접근 권한):
  .claude/context/security-policy.md
  .claude/skills/pool-detail.md
  .claude/skills/rbac-masking.md

```
