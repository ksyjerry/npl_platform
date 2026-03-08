# Phase 5 — 공지사항 + 용어사전 + 서비스소개 + 상담
## 상세 실행 지침

> Phase 4(거래자료) 완료 후 시작.
> Phase 5는 5개 서브태스크로 분리 실행한다.
> 각 서브태스크는 독립적으로 Claude Code 세션에 붙여넣어 실행한다.

---

## 서브태스크 순서

```
5-A  Backend 공통 기반  (Notice + Glossary + Consulting 스키마/레포/서비스/라우터)
5-B  Glossary seed      (용어사전 11개 초기 데이터)
5-C  공개 페이지 UI     (홈 랜딩 + B1 매각자문 + B2 인수자문 + 상담 모달)
5-D  운영 페이지 UI     (C1 공지사항 + D1~D3 고객지원)
5-E  통합 검증          (연결 흐름 + 완료 기준 확인)
```

---

## 5-A — Backend 공통 기반

### Claude Code에 붙여넣을 프롬프트

```
아래 파일들을 읽어:
  .claude/agents/backend.md
  .claude/context/domain-model.md
  .claude/context/api-contracts.md

읽은 후 다음 순서로 구현해.
각 파일 완성 후 다음으로 넘어가고, 중간에 멈추지 마.

─── 1. schemas ───────────────────────────────────────────

backend/app/schemas/notice.py
  - NoticeCreate: pool_id(optional int), category(str), title(str), content(str)
  - NoticeUpdate: category/title/content/pool_id 모두 Optional + reason(str 필수)
  - NoticeResponse: id, pool_id, category, title, has_attachment(bool),
                    created_by_name(str), created_at
  - NoticeDetail: NoticeResponse 상속 + content, attachment_doc_id(optional),
                  attachment_name(optional)

backend/app/schemas/glossary.py
  - GlossaryItem: id, term, definition, sort_order
  - GlossaryListResponse: items(list[GlossaryItem])

backend/app/schemas/consulting.py
  - ConsultingCreate: type(Literal["selling","buying"]), title(str), content(str)
  - ConsultingResponse: id, type, title, status, created_at
  - ConsultingDetail: ConsultingResponse 상속 + content, reply(optional),
                      replied_at(optional), user_name(str), company_name(str)

─── 2. repositories ──────────────────────────────────────

backend/app/repositories/notice.py
  - get_all(db, pool_id=None, page=1, size=20) → 목록 + total
    ※ pool_id 있으면 해당 pool 공지만, 없으면 전체 공지(pool_id IS NULL인 것) 포함
  - get_or_404(db, notice_id) → 없으면 HTTPException 404
  - create(db, data, created_by_id, file_name=None, file_path_enc=None)
  - update(db, notice_id, data)   ← audit_log 기록 포함
  - delete(db, notice_id, reason, deleted_by_id)

backend/app/repositories/glossary.py
  - get_all(db) → sort_order 오름차순 정렬

backend/app/repositories/consulting.py
  - create(db, user_id, data) → status="pending"
  - get_list(db, user_id, role, page, size)
    ※ role이 seller/buyer면 user_id 필터, admin/accountant면 전체
  - get_or_404(db, consulting_id)

─── 3. services ──────────────────────────────────────────

backend/app/services/notice.py
  - get_notices(db, pool_id, page, size) → PaginatedResponse
  - get_notice_detail(db, notice_id) → NoticeDetail
  - create_notice(db, data, file, current_user)
    ※ file 있으면 file_validator 통과 후 file_storage.upload() 호출
    ※ file_path_enc = encrypt_path(raw_path)
  - update_notice(db, notice_id, data, current_user)
    ※ audit_log.record(db, "notices", notice_id, "UPDATE", reason, current_user.id)
  - delete_notice(db, notice_id, reason, current_user)
    ※ audit_log.record(db, "notices", notice_id, "DELETE", reason, current_user.id)

backend/app/services/glossary.py
  - get_glossary(db) → GlossaryListResponse

backend/app/services/consulting.py
  - submit(db, data, current_user) → ConsultingResponse
  - get_my_list(db, current_user, page, size) → PaginatedResponse
    ※ role seller/buyer: 본인 것만 / admin/accountant: 전체

─── 4. routers ───────────────────────────────────────────

backend/app/api/v1/notices.py
  GET  /notices          Depends(get_current_user)  → services.get_notices
  GET  /notices/{id}     Depends(get_current_user)  → services.get_notice_detail
  POST /notices          Depends(require_role(["admin","accountant"]))
                         Content-Type: multipart/form-data
  PATCH /notices/{id}    Depends(require_role(["admin","accountant"]))
                         reason 누락 시 422
  DELETE /notices/{id}   Depends(require_role(["admin","accountant"]))
                         body: {"reason": "..."}

backend/app/api/v1/glossary.py
  GET /glossary          인증 불필요 (공개)

backend/app/api/v1/consulting.py
  POST /consulting        Depends(get_current_user)
  GET  /consulting        Depends(get_current_user)

─── 5. main.py 라우터 등록 ───────────────────────────────

app.include_router(notices.router,   prefix="/api/v1", tags=["notices"])
app.include_router(glossary.router,  prefix="/api/v1", tags=["glossary"])
app.include_router(consulting.router,prefix="/api/v1", tags=["consulting"])

─── 6. 테스트 ────────────────────────────────────────────

backend/tests/test_phase5_backend.py

테스트 케이스:
  [공지사항]
  - test_notice_list_requires_auth           GET /notices → 401 (미인증)
  - test_notice_list_authenticated           GET /notices → 200 (인증 후)
  - test_notice_create_by_accountant         POST /notices → 201
  - test_notice_create_forbidden_by_seller   POST /notices → 403 (seller 불가)
  - test_notice_patch_requires_reason        PATCH /notices/1 reason="" → 422
  - test_notice_detail                       GET /notices/1 → content 포함

  [용어사전]
  - test_glossary_public                     GET /glossary → 200 (인증 없이)
  - test_glossary_count                      items 11개 확인

  [상담]
  - test_consulting_submit                   POST /consulting → 201 status=pending
  - test_consulting_list_seller_own_only     seller는 본인 것만
  - test_consulting_list_admin_all           admin은 전체

완료 기준:
  pytest backend/tests/test_phase5_backend.py -v → 전체 PASS
```

---

## 5-B — Glossary Seed 데이터

### Claude Code에 붙여넣을 프롬프트

```
.claude/context/domain-model.md 의 glossary 섹션을 읽어.

아래 작업을 순서대로 실행해:

1. alembic data migration 파일 생성
   파일명: backend/alembic/versions/002_glossary_seed.py

   def upgrade():
     op.execute("""
       INSERT INTO glossary (term, definition, sort_order) VALUES
       ('NPL (Non-Performing Loan)',
        '금융기관의 부실채권. 원금 또는 이자가 3개월 이상 연체되어 정상적인 회수가 어려운 대출채권.',
        1),
       ('자산확정일 (Cut-off Date)',
        '매각 대상 채권을 확정하는 기준일. 이 날짜 기준으로 OPB(원금잔액)와 채권 정보를 산정한다.',
        2),
       ('매각대상자산',
        '금융기관이 매각하고자 하는 NPL 채권 묶음(Pool). 무담보·담보·PF 등 다양한 유형을 포함한다.',
        3),
       ('Data Disk',
        'Pool에 포함된 개별 채권 정보를 담은 원천 데이터. 차주 정보, 채권 잔액, 담보 정보 등이 포함된다.',
        4),
       ('Invitation Letter (IL)',
        '삼일PwC가 적격 투자자에게 입찰 참여를 공식 초청하는 문서. IL 수령 후 NDA 체결 절차가 진행된다.',
        5),
       ('입찰참가의향서 (LOI)',
        '투자자가 특정 Pool 입찰에 참여하겠다는 의향을 공식 표명하는 문서.',
        6),
       ('비밀유지서약서 (NDA)',
        '투자자가 Data Disk 열람 전 체결하는 기밀 유지 약정서. NDA 체결 후 자료 접근이 허용된다.',
        7),
       ('적격 투자자',
        '삼일PwC가 정한 기준(자산 규모, NPL 투자 경험 등)을 충족하여 입찰 참여 자격이 인정된 기관 투자자.',
        8),
       ('Bid Package',
        '입찰 참가자에게 제공되는 입찰 자료 묶음. Data Disk, LSPA 초안, 입찰 지침서 등이 포함된다.',
        9),
       ('자산양수도계약서 (LSPA)',
        'Loan Sale and Purchase Agreement. NPL 채권의 매각·인수를 확정하는 최종 계약서.',
        10),
       ('Interim',
        '거래 종결 전 과도기(중간 정산) 기간. 자산확정일 이후 거래 종결일까지의 이자·원금 변동을 처리한다.',
        11)
     """)

   def downgrade():
     op.execute("DELETE FROM glossary")

2. 마이그레이션 실행
   alembic upgrade head

3. 검증
   psql 또는 SQLAlchemy로 SELECT count(*) FROM glossary 실행 → 11 확인
   GET /glossary API 호출 → items 11개 반환 확인
```

---

## 5-C — 공개 페이지 UI (홈 + 서비스소개 + 상담 모달)

### Claude Code에 붙여넣을 프롬프트

```
아래 파일들을 읽어:
  .claude/agents/frontend.md       (섹션 9, 10 반드시 읽기)
  .claude/agents/design.md         (섹션 2.1, 2.2 반드시 읽기)
  .claude/skills/design-system.md  (섹션 1~6 전체)
  .claude/context/api-contracts.md (POST /consulting 스펙)

읽은 후 아래 순서대로 구현해. 공개 페이지이므로 인증 없이 접근 가능해야 함.

─── 1. 공통 레이아웃 컴포넌트 (미구현 시만) ──────────────

아래 파일이 없으면 지금 만들어:

frontend/components/layout/Navbar.tsx
  - 높이 64px, sticky top-0, z-50, bg-white, border-b border-[#DEDEDE]
  - 좌측: PwC 오렌지 워드마크 + "NPL 센터" 텍스트
  - 중앙: 홈 / 매각 자문 / 인수 자문 / 거래현황 / 고객지원
          (활성 경로 → text-[#D04A02] font-semibold)
  - 우측 비로그인: [로그인] ghost | [회원가입] outline-orange
         로그인 후: 이름+역할 배지 | [마이페이지] | [로그아웃]
  - 모바일: hamburger 토글

frontend/components/layout/Footer.tsx
  - bg-[#2D2D2D] text-white py-12
  - 좌: 삼일PwC 워드마크 + 주소 (caption, opacity-60)
  - 우: 메뉴 링크 모음
  - 최하단: copyright (caption, opacity-40)

frontend/components/layout/Section.tsx
  - bg variant: 'white' | 'gray' | 'dark'
  - py-16 md:py-24
  - divider prop: true면 하단 border-b-4 border-[#D04A02]
  - 내부: max-w-5xl mx-auto px-8

frontend/components/layout/PageHeader.tsx
  - bg-[#2D2D2D] + 하단 border-b-4 border-[#D04A02] (필수)
  - overline / h1 / subtitle props
  - max-w-5xl mx-auto px-8 py-16

─── 2. 홈 랜딩페이지 ─────────────────────────────────────

frontend/components/home/HeroSection.tsx
  배경: bg-[#2D2D2D]  최소높이: min-h-[600px]  패딩: px-8 py-24
  하단: border-b-4 border-[#D04A02]  ← 반드시 포함
  내부 max-w-5xl mx-auto:
    overline:  "Samil PricewaterhouseCoopers"  text-caption tracking-[0.12em]
               uppercase text-white opacity-60
    h1:        "온라인 NPL 센터"  text-display font-heading text-white mt-4
    서브카피:  "NPL 매각·인수 거래 프로세스를 디지털화하여
               거래 투명성과 운영 효율성을 높입니다."
               text-body-lg text-white opacity-80 mt-6 max-w-[540px]
    CTA:       mt-10 flex gap-4
      [매각 자문] → /service/selling   bg-[#D04A02] text-white px-8 py-3.5
      [인수 자문] → /service/buying    border-2 border-white text-white px-8 py-3.5
                                       hover:bg-white hover:text-[#2D2D2D]

frontend/components/home/ServiceCard.tsx
  Props: title, desc, href, cta
  border border-[#DEDEDE] rounded p-8
  hover: border-[#D04A02] 전환
  아이콘(pwc-orange 32px) + h3(gray-800) + 설명(body-sm gray-700 mt-3)
  + cta 링크(body-sm pwc-orange mt-6) "→"

frontend/components/home/FeatureCard.tsx
  Props: icon, title, desc
  text-center, 아이콘 48px, h3(gray-800 mt-4), 설명(body-sm gray-700 mt-2)

frontend/app/(public)/page.tsx  ← 서버 컴포넌트
  섹션 순서:
  ① <HeroSection />
  ② <Section bg="white">   서비스카드 2개 (grid-cols-2 gap-8)
                             [매각 자문] + [인수 자문]
  ③ <Section bg="gray">    특장점 3개 (grid-cols-3 gap-6)
                             🔒거래투명성 / ⚡딜발굴효율화 / 📁통합자료관리
                             h2("삼일PwC NPL 플랫폼이 제공하는 가치") 섹션 상단
  ④ <Section bg="dark">    하단 CTA
                             h2("지금 시작하세요") + 설명 + [회원가입][로그인]

─── 3. 상담 신청 공통 컴포넌트 ───────────────────────────

frontend/components/consulting/ConsultingModal.tsx
  "use client"
  Props: type("selling"|"buying"), isOpen, onClose
  react-hook-form + zod 유효성:
    title:   z.string().min(1, "상담 제목을 입력해주세요.")
    content: z.string().min(10, "상담 내용을 10자 이상 입력해주세요.")

  onSubmit:
    1. 미로그인 → 401 응답 → router.push("/auth/login?redirect=" + encodeURIComponent(pathname))
    2. 성공 → toast.success("상담 신청이 완료되었습니다.") → onClose() → reset()
    3. 기타 오류 → toast.error("신청 중 오류가 발생했습니다.")

  API 호출: POST /api/v1/consulting { type, title, content }

  모달 UI:
    DialogHeader: "{type === 'selling' ? '매각' : '인수'} 상담 신청"
    DialogDescription: "담당 전문가가 검토 후 연락드립니다."
    [상담 제목] Input + 에러 메시지
    [상담 내용] Textarea rows=5 + 에러 메시지
    Footer: [취소] secondary | [신청하기] primary type="submit"

frontend/components/consulting/ConsultingButton.tsx
  "use client"
  Props: type("selling"|"buying")
  useState(false) → ConsultingModal open 제어
  버튼: bg-[#D04A02] text-white px-10 py-4 text-lg font-semibold
        "{type === 'selling' ? '매각' : '인수'} 상담 신청하기"

─── 4. B1 매각 자문 페이지 ───────────────────────────────

frontend/app/(public)/service/selling/page.tsx  ← 서버 컴포넌트
  섹션 순서:
  ① <PageHeader
       overline="서비스 소개"
       title="매각 자문"
       subtitle="삼일PwC는 금융기관의 NPL 매각 전 과정을 전문적으로 지원합니다."
     />
  ② <Section bg="white">
       h2("취급 자산 유형")
       AssetTypeCard × 3:
         { type:"무담보 NPL", desc:"개인·법인 무담보 부실채권 (CCRS, IRL 포함)" }
         { type:"담보 NPL",   desc:"부동산 등 담보 부실채권 (Regular, Special)" }
         { type:"PF 채권",    desc:"프로젝트 파이낸싱 관련 부실채권" }
       ※ 하단 노트 (border-l-4 border-[#FFB600] pl-4 text-body-sm text-[#7D7D7D]):
         "NPL성 실물자산(부동산 등)도 접수 가능합니다. 상담 신청 시 함께 문의해 주세요."
  ③ <Section bg="gray">
       h2("매각 프로세스")
       <ProcessSteps steps={[
         { step:"01", title:"매각 상담 신청", desc:"자산 현황 및 매각 조건 협의" },
         { step:"02", title:"자산 실사·평가", desc:"Data Disk 작성 및 MRP 산정" },
         { step:"03", title:"투자자 모집",    desc:"Invitation Letter 발송 및 입찰 진행" },
         { step:"04", title:"거래 종결",      desc:"LSPA 체결 및 채권 양수도 완료" },
       ]} />
  ④ <Section bg="white">
       text-center
       h2("매각 상담 신청") + 설명 텍스트
       <ConsultingButton type="selling" />

─── 5. B2 인수 자문 페이지 ───────────────────────────────

frontend/app/(public)/service/buying/page.tsx  ← 서버 컴포넌트
  섹션 순서:
  ① <PageHeader
       overline="서비스 소개"
       title="인수 자문"
       subtitle="삼일PwC는 F&I·자산운용사 등 적격 투자자의 NPL 인수를 지원합니다."
     />
  ② <Section bg="white">
       h2("투자 대상 자산")
       AssetTypeCard × 3 (B1과 동일 유형)
  ③ <Section bg="gray">
       h2("적격 투자자 기준") 
       ul (space-y-3):
         ✓ 충분한 자산 규모 및 NPL 투자 경험 보유
         ✓ NDA·LOI 제출 가능한 기관
         ✓ 내부통제 및 관련 자격 요건 충족
       (h2를 divider로 분리하여) h2("입찰 참여 프로세스")
       <ProcessSteps steps={[
         { step:"01", title:"인수 상담 신청",     desc:"투자 관심 자산 및 규모 협의" },
         { step:"02", title:"적격 투자자 확인",   desc:"NDA 체결 및 Invitation Letter 수령" },
         { step:"03", title:"Bid Package 수령",   desc:"Data Disk·LSPA 초안 등 검토" },
         { step:"04", title:"입찰 및 거래 종결",  desc:"온라인 입찰서류 제출 및 LSPA 체결" },
       ]} />
  ④ <Section bg="white">
       text-center
       h2("인수 상담 신청") + 설명 텍스트
       <ConsultingButton type="buying" />

─── 6. 공통 서브 컴포넌트 ────────────────────────────────

frontend/components/service/AssetTypeCard.tsx
  Props: type(string), desc(string)
  border border-[#DEDEDE] rounded p-8
  hover: border-[#D04A02]
  h3(font-heading gray-800) + p(body-sm gray-700 mt-3 leading-relaxed)

frontend/components/ui/ProcessSteps.tsx
  Props: steps[{ step, title, desc }]
  grid-cols-1 md:grid-cols-4 gap-8
  각 스텝: 원형 배지(#D04A02 bg, white 텍스트, 48px) + 연결선(md 이상에서)
           + h4(font-heading gray-800 mt-4) + p(body-sm gray-500 mt-2)

─── 완료 기준 확인 ───────────────────────────────────────

구현 완료 후 아래를 직접 확인해:
  1. localhost:3000 접속 → Navbar + Hero + 섹션 교차 배경 확인
  2. [매각 자문] 클릭 → /service/selling 이동 → 4개 섹션 정상 표시
  3. [매각 상담 신청하기] 클릭 → 미로그인이면 /auth/login?redirect=... 이동
  4. 로그인 후 [상담 신청하기] 클릭 → 모달 열림 → 제출 → toast 확인
  5. 모바일 뷰(375px)에서 Navbar hamburger, 카드 1열, 텍스트 잘림 없음 확인
```

---

## 5-D — 운영 페이지 UI (C1 공지사항 + D1~D3 고객지원)

### Claude Code에 붙여넣을 프롬프트

```
아래 파일들을 읽어:
  .claude/agents/frontend.md
  .claude/agents/design.md         (섹션 2.6 고객지원 부분)
  .claude/skills/design-system.md  (섹션 5.6~5.7 테이블·운영 페이지)
  .claude/context/api-contracts.md (GET/POST /notices, GET /glossary)
  .claude/CLAUDE.md                (섹션 7 용어사전 seed 목록)

읽은 후 아래 순서로 구현해.
이 페이지들은 인증(로그인) 후에만 접근 가능한 운영 페이지다.
운영 페이지 스타일: 테이블 중심, 여백 최소화, 마케팅 스타일 금지.

─── 1. 타입 + 훅 ─────────────────────────────────────────

frontend/types/notice.ts
  export interface Notice {
    id: number
    category: string
    title: string
    has_attachment: boolean
    created_by_name: string
    created_at: string
  }
  export interface NoticeDetail extends Notice {
    content: string
    attachment_doc_id: number | null
    attachment_name: string | null
  }
  export interface NoticeCreateInput {
    pool_id?: number
    category: string
    title: string
    content: string
    file?: File
  }

frontend/types/glossary.ts
  export interface GlossaryItem {
    id: number
    term: string
    definition: string
    sort_order: number
  }

frontend/hooks/useNotices.ts
  - useNotices(poolId?) → TanStack Query, GET /notices?pool_id=&page=&size=
  - useNoticeDetail(noticeId) → GET /notices/{id}
  - useCreateNotice() → mutation POST /notices (multipart/form-data)
  - useUpdateNotice() → mutation PATCH /notices/{id} (reason 필수)

frontend/hooks/useGlossary.ts
  - useGlossary() → TanStack Query, GET /glossary (staleTime: Infinity — 변경 거의 없음)

─── 2. C1 공지사항 목록 페이지 ──────────────────────────

frontend/app/(authenticated)/notices/page.tsx
  레이아웃: 운영 페이지 패턴
    [페이지 제목 바] "공지사항"  border-b
    [우측 상단] accountant/admin만 [+ 공지 등록] primary-sm 버튼 표시
               (lib/rbac.ts can("notice:create", user.role) 사용)
    [테이블]
      헤더(bg-[#2D2D2D] white): No | 구분 | 제목 | 첨부 | 등록자 | 등록일
      행: 번호 | category | title(클릭 → /notices/{id}) | 💾(has_attachment 시)
          | created_by_name | created_at(YYYY-MM-DD)
      짝수 행 bg-[#FAFAFA], 호버 bg-[#FFF5EE]
      제목 링크: text-[#2D2D2D] hover:text-[#D04A02] hover:underline
    [페이지네이션] 하단 우측, 20행씩
    [빈 상태] "등록된 공지사항이 없습니다." gray-500 text-center py-16

frontend/app/(authenticated)/notices/[id]/page.tsx
  서버 컴포넌트 + 클라이언트 액션 분리
  [breadcrumb] 공지사항 > [제목]  gray-500 body-sm
  [카드 컨테이너] max-w-3xl mx-auto
    [헤더] 구분(배지) + 제목(h2) + 등록자·등록일(caption gray-500) + 구분선
    [본문] whitespace-pre-wrap body text-[#464646]
    [첨부파일] has_attachment이면 [💾 파일명] 클릭 → GET /documents/{id}/download
    [하단] [목록으로] ghost 버튼
    accountant/admin: [수정] secondary | [삭제] danger 버튼 추가
                      수정 클릭 → NoticeEditModal
                      삭제 클릭 → ReasonModal → DELETE /notices/{id}

frontend/components/notices/NoticeEditModal.tsx
  "use client"
  기존 데이터 pre-fill
  pool_id(optional) / category / title / content / 첨부파일(선택 교체)
  제출 시 ReasonModal 먼저 → reason 확인 후 PATCH

─── 3. C1 공지 등록 모달 ────────────────────────────────

frontend/components/notices/NoticeCreateModal.tsx
  "use client"
  Fields:
    pool_id: Select (진행 중인 Pool 목록 로드, "전체 공지"도 선택 가능)
    category: Input (예: "PwC-SB 2026-1 Program" 또는 "전체")
    title: Input (필수)
    content: Textarea rows=8 (필수)
    file: Input type="file" (선택, 클릭 시 파일 선택)
          accept=".pdf,.xlsx,.docx,.zip" 제한
  제출: multipart/form-data POST /notices → 201 → toast.success → 목록 갱신

─── 4. D2 용어사전 페이지 ────────────────────────────────

frontend/app/(authenticated)/support/glossary/page.tsx
  데이터: useGlossary() — GET /glossary (sort_order 오름차순)
  레이아웃:
    [페이지 제목 바] "용어사전"
    [설명] "NPL 거래에서 자주 사용되는 주요 용어를 정리했습니다."
           body-sm gray-500, mb-6
    [용어 목록] 아코디언 or 카드 그리드 (2열)
      각 항목:
        term:       text-h3 font-heading gray-800
        definition: body gray-700 mt-2 leading-relaxed
      border border-[#DEDEDE] rounded p-6
      hover: border-[#D04A02]

  ※ 11개 모두 표시, 페이지네이션 불필요
  ※ 데이터는 API에서 가져오고 seed는 5-B에서 이미 등록됨

─── 5. D1 이용 가이드 페이지 ────────────────────────────

frontend/app/(authenticated)/support/guide/page.tsx
  MVP 구현 (정적 콘텐츠):
  [페이지 제목 바] "이용 가이드"
  섹션 4개:
    1. 서비스 개요  — 플랫폼 역할 설명
    2. 회원가입 안내 — 가입 후 관리자 인증 필요 설명
    3. Pool 거래현황 이용 방법 — 목록/상세 열람 방법
    4. 거래자료 등록/다운로드 — 역할별 자료 등록 방법
  각 섹션: h3(font-heading) + body 텍스트 + border-l-4 border-[#D04A02] pl-4 강조 노트

─── 6. D3 FAQ 페이지 ────────────────────────────────────

frontend/app/(authenticated)/support/faq/page.tsx
  MVP 구현 (정적 콘텐츠):
  [페이지 제목 바] "자주 묻는 질문"
  아코디언 형태 FAQ 5개:
    Q1. 회원가입 후 바로 이용할 수 있나요?
        → 아니요. 관리자의 인증 처리 후 이용 가능합니다.
    Q2. Pool 상세 정보는 누구나 볼 수 있나요?
        → 종결된 Pool은 참여 이력이 있는 업체만 열람 가능합니다.
    Q3. 거래자료는 어떻게 등록하나요?
        → 역할(매도인/매수인/회계법인)에 따라 접근 가능한 탭이 다릅니다.
    Q4. 상담 신청은 어떻게 하나요?
        → 매각/인수 자문 페이지에서 '상담 신청하기' 버튼을 클릭하세요.
    Q5. 비밀번호를 잊어버렸어요.
        → 관리자에게 비밀번호 초기화를 요청해주세요.
  아코디언 UI: 클릭 시 펼침, 질문(font-semibold) + 답변(body-sm gray-700)
               border-b border-[#DEDEDE], 펼쳐진 항목 border-l-4 border-[#D04A02]

─── 7. lib/rbac.ts 업데이트 ─────────────────────────────

아래 권한 추가 (기존 PERMISSIONS에 merge):
  "notice:create"  : ["admin", "accountant"]
  "notice:edit"    : ["admin", "accountant"]
  "notice:delete"  : ["admin", "accountant"]
  "consulting:view": ["admin", "accountant", "seller", "buyer"]

─── 완료 기준 확인 ───────────────────────────────────────

구현 완료 후 아래를 직접 확인해:
  1. /notices 접근 → 로그인 안 했으면 /auth/login으로 리다이렉트
  2. accountant 로그인 → [+ 공지 등록] 버튼 표시, seller 로그인 → 버튼 없음
  3. 공지 등록 → 목록에 즉시 반영
  4. 공지 수정 → ReasonModal reason 빈값 → 422 에러 toast 표시
  5. /support/glossary → 용어 11개 모두 표시 확인
  6. /support/guide, /support/faq → 정적 콘텐츠 정상 표시
```

---

## 5-E — 통합 검증

### Claude Code에 붙여넣을 프롬프트

```
.claude/agents/security.md 와 .claude/context/security-policy.md 를 읽어.

Phase 5 전체 연결 흐름을 검증해.
아래 항목을 순서대로 실행하고 각 결과를 보고해.

─── 1. 연결 흐름 E2E 검증 ────────────────────────────────

[흐름 1] 상담 신청 → 관리자 확인
  ① 브라우저: /service/selling → [매각 상담 신청하기] 클릭
  ② 미로그인 → /auth/login?redirect=/service/selling 로 이동하는지 확인
  ③ seller 계정으로 로그인 → redirect → 모달 오픈 확인
  ④ 제목 + 내용 입력 → [신청하기] → 201 응답 + toast 확인
  ⑤ admin 로그인 → /admin/consulting → 방금 신청 내역 확인 (Phase 6 구현 전이면 API 직접 호출)
     GET /api/v1/admin/consulting?type=selling

[흐름 2] 공지사항 등록 → 조회
  ① accountant 로그인 → /notices → [+ 공지 등록]
  ② pool_id 없음(전체 공지), category="전체", title="테스트 공지", content="내용"
  ③ 등록 → 201 → 목록에 나타남 확인
  ④ 제목 클릭 → 상세 페이지 정상 표시
  ⑤ seller 로그인 → /notices → 동일 공지 조회 가능, [수정]/[삭제] 버튼 없음 확인

[흐름 3] 용어사전 seed 확인
  GET /api/v1/glossary → items 배열 11개, sort_order 오름차순 정렬 확인
  /support/glossary 페이지 → 11개 모두 표시 확인

─── 2. 보안 체크 ────────────────────────────────────────

grep -rn "@router.post\|@router.get\|@router.patch\|@router.delete" \
  backend/app/api/v1/notices.py \
  backend/app/api/v1/consulting.py \
  | grep -v "Depends\|require_role\|get_current_user"
→ 결과가 나오면 인증 누락. 해당 엔드포인트에 Depends 추가.

GET /glossary 는 의도적으로 인증 없음 — 결과에 나와도 정상.

─── 3. Phase 5 완료 체크리스트 ──────────────────────────

아래 항목 전부 확인 후 [완료] / [미완료] 보고:

  Backend:
  [ ] POST /consulting  → 201, status=pending
  [ ] GET  /consulting  → seller는 본인 것만, admin은 전체
  [ ] GET  /notices     → 인증 필요, 200
  [ ] POST /notices     → accountant/admin만, seller → 403
  [ ] PATCH /notices    → reason 없으면 422
  [ ] GET  /glossary    → 인증 없이 200, 11개

  Frontend:
  [ ] 홈 랜딩 4개 섹션 정상 표시
  [ ] B1/B2 각 4개 섹션 정상 표시
  [ ] ConsultingModal 미로그인 redirect 동작
  [ ] ConsultingModal 제출 후 toast 표시
  [ ] /notices 목록 + 상세 정상
  [ ] 공지 등록 권한 분기 (accountant O, seller X)
  [ ] /support/glossary 11개 표시
  [ ] /support/guide, /support/faq 정적 콘텐츠 표시

  연결:
  [ ] 상담 신청 → pending 상태로 DB 저장 확인
  [ ] 공지 수정 → audit_log 기록 확인
      SELECT * FROM audit_logs WHERE table_name='notices' ORDER BY id DESC LIMIT 5;

─── 4. 미결사항 검토 (CLAUDE.md 섹션 10) ───────────────

아래 2개 항목 현재 구현 상태를 정리해줘:

① 공지사항 운영 범위 (High)
   현재 구현: pool_id nullable로 전체/Pool별 공지 모두 가능
   판단 필요: 일반 공지(전체)와 거래별 공지를 UI에서 어떻게 구분 표시할지
   → 현재는 category 필드로 구분 표시 중. 추가 의사결정 필요 시 Jerry에게 확인.

② NPL성 실물자산 (Low)
   현재 구현: B1 페이지 하단 노트로 "접수 가능" 안내 문구 추가됨
   판단 필요: 별도 자산 유형 카드 추가 여부
   → 현재 안내 문구로 MVP 충족. 정식 반영은 추후.
```

---

## 요약: 서브태스크별 소요 예상 및 의존성

```
5-A (Backend)   ───────────────────────────────────────── 먼저
5-B (Seed)      ─── 5-A 완료 후 ────────────────────────
5-C (공개 UI)   ─── 5-A 완료 후 (5-B와 병렬 가능) ──────
5-D (운영 UI)   ─── 5-A, 5-B 완료 후 ────────────────────
5-E (검증)      ─── 5-A ~ 5-D 모두 완료 후 ────────────

의존성 요약:
  5-C는 POST /consulting API만 있으면 시작 가능 (5-A 완료 직후)
  5-D는 GET /notices, GET /glossary API 필요 (5-A + 5-B 완료 후)
  5-E는 전부 완료 후
```
