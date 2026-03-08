# Agent: Design — PwC 브랜드 UI 구현 전담

## 역할
삼일PwC 온라인 NPL 플랫폼의 모든 UI/UX를 구현한다.
PwC 코리아 웹사이트(pwc.com/kr/ko)의 시각 언어를 벤치마킹하여
**마케팅 랜딩 품질의 공개 페이지 + 깔끔한 운영 페이지**를 만드는 것이 목표다.

## 작업 전 필수 확인
```
1. .claude/skills/design-system.md   ← 컬러·폰트·컴포넌트 스펙 전체
2. .claude/agents/frontend.md        ← 페이지 구조 및 라우팅
3. .claude/context/domain-model.md   ← 데이터 구조 (테이블 컬럼 등)
```

---

## 1. PwC 코리아 사이트 벤치마크 분석

### 핵심 시각 언어 (pwc.com/kr/ko 관찰 결과)

| 요소 | PwC 코리아 패턴 | NPL 플랫폼 적용 방식 |
|---|---|---|
| **배경** | 다크 차콜(#2D2D2D) ↔ 화이트 강한 대비 | 히어로·페이지헤더·CTA = 다크, 나머지 = 화이트/회색 교차 |
| **시그니처 컬러** | 오렌지(#D04A02)를 포인트에만 제한적 사용 | CTA 버튼, 링크, 섹션 구분 오렌지 라인 4px |
| **타이포** | Georgia 계열 헤딩 + Arial 본문, 충분한 자간 | Noto Serif KR / Noto Sans KR |
| **카드** | 날카로운 모서리(radius 4px), 호버 시 보더 강조 | 동일 (border-radius 6px 이상 절대 금지) |
| **네비** | 화이트 배경, 하단 보더, 링크 호버 시 오렌지 | 동일 |
| **레이아웃** | 최대 너비 제한 + 넓은 여백, 섹션 교차 배경 | max-w-5xl, 섹션 py-16~py-24 |
| **버튼** | 날카로운 모서리, 오렌지 채움 / 아웃라인 2종 | 4종(primary/secondary/ghost/danger) |
| **오렌지 수평 라인** | 섹션 구분·강조에 4px 오렌지 라인 사용 | 히어로 하단, 페이지헤더 하단 필수 |

### PwC와 다른 점 (NPL 플랫폼 전용 요소)
- 상태 배지 시스템 (active/closed/cancelled 등)
- 회원 인증 흐름 UI
- 미공개 필드 마스킹 처리 ("—" 표시)
- 수정 사유 모달 (PATCH 전 공통)
- 역할별 접근 제어에 따른 UI 분기

---

## 2. 페이지별 구현 가이드

### 2.1 홈 (A) — 랜딩페이지

**원칙:** 운영 대시보드 스타일 절대 금지. 마케팅 랜딩페이지.

```
섹션 구성:
① Hero          #2D2D2D 배경, min-h-[600px], 오렌지 하단 라인
② 서비스 카드   white 배경, 2열 그리드
③ 특장점        #F5F5F5 배경, 3열 그리드
④ 하단 CTA      #2D2D2D 배경, 회원가입 유도
```

```typescript
// 히어로 카피 (PwC 톤앤매너: 간결·전문적)
헤딩:   "온라인 NPL 센터"
서브:   "NPL 매각·인수 거래 프로세스를 디지털화하여\n거래 투명성과 운영 효율성을 높입니다."
CTA1:   "매각 자문"   → /service/selling  (primary 버튼, white 텍스트)
CTA2:   "인수 자문"   → /service/buying   (secondary 버튼, white 보더)

// 특장점 카드 카피 (이해관계자별 기대효과 기반)
① 아이콘:🔒  제목:"거래 투명성 확보"  설명:"단일 온라인 창구로 매각 이력 및 감독당국 보고를 간소화합니다."
② 아이콘:⚡  제목:"딜 발굴 효율화"   설명:"온라인 입찰 참여로 매수인의 Deal 발굴 비용과 시간을 줄입니다."
③ 아이콘:📁  제목:"통합 자료 관리"   설명:"거래 자료 배포·관리를 단일 플랫폼에서 처리합니다."
```

### 2.2 서비스 소개 (B1 매각 자문 / B2 인수 자문)

```
섹션 구성:
① PageHeader    #2D2D2D + overline + h1 + 서브카피 + 오렌지 라인
② 자산 유형     white, 3카드 그리드
③ 프로세스      #F5F5F5, 4단계 수평 흐름
④ 상담 CTA      white, 중앙 정렬, ConsultingButton 포함
```

```typescript
// B1 매각 자문 카피
PageHeader:
  overline: "서비스 소개"
  h1: "매각 자문"
  서브: "삼일PwC는 금융기관의 NPL 매각 전 과정을 전문적으로 지원합니다."

자산 유형 카드:
  { type: "무담보 NPL", desc: "개인·법인 무담보 부실채권 (CCRS, IRL 포함)" }
  { type: "담보 NPL",   desc: "부동산 등 담보 부실채권 (Regular, Special)" }
  { type: "PF 채권",    desc: "프로젝트 파이낸싱 관련 부실채권" }
  ※ 하단 노트: "NPL성 실물자산도 접수 가능합니다."  (미결사항 #7)

프로세스 4단계:
  01 매각 상담 신청 → 02 자산 실사·평가(Data Disk) → 03 투자자 모집(IL) → 04 거래 종결(LSPA)

// B2 인수 자문 카피
PageHeader:
  overline: "서비스 소개"
  h1: "인수 자문"
  서브: "삼일PwC는 F&I·자산운용사 등 적격 투자자의 NPL 인수를 지원합니다."

프로세스 4단계:
  01 인수 상담 신청 → 02 적격 투자자 확인(NDA) → 03 Bid Package 수령 → 04 입찰·거래 종결
```

### 2.3 Pool 목록 (C2-1)

```typescript
// 운영 페이지 레이아웃
페이지 제목 바:   "거래현황" (h2) + "Pool 목록 및 상세정보를 확인할 수 있습니다." (body-sm gray-500)
필터 바:         상태 탭 [전체|진행|종결] + 검색 input (Pool명, 자산유형)
테이블 컬럼:     No / Pool명 / 자산유형(담보/무담보/PF) / 자산확정일 / 입찰기일
                 / 매각방식 / 상태Badge / [상세보기]
                 ※ seller_name, buyer_name → 참여이력 없는 경우 "—"
빈 상태:         "조건에 맞는 Pool이 없습니다." (gray-500, 중앙)
페이지네이션:    하단 우측, 페이지당 20행
```

### 2.4 Pool 상세 (C2-2)

```typescript
// 역할별 UI 분기 — skills/pool-detail.md 참조
Breadcrumb:   거래현황 > [Pool명]
탭 구성:      거래정보 / 거래 참여자 / 담보·채권 정보 / 가격 정보 / 재매각 / 첨부파일

// 편집 권한 (accountant, admin만)
[수정] 버튼 → ReasonModal → PATCH
모든 수정: reason 필드 필수, 빈 값 불가

// 파일 다운로드
IL, Bid Package, 입찰서류, 기타자료
→ StreamingResponse 경유, 직접 경로 노출 금지
→ [다운로드 💾] 버튼, body-sm pwc-orange
```

### 2.5 거래자료 (C3 — seller/buyer/accountant)

```typescript
// 3개 서브페이지 동일 레이아웃, 역할별 접근만 다름
페이지 제목:  "거래자료 — 매도인" / "— 매수인" / "— 회계법인"
게시판 형태:  테이블 (제목 / 등록일 / 등록자 / [보기])
              row 클릭 → 상세 모달 또는 상세 페이지
등록/수정:    [+ 자료 등록] primary 버튼 (우측 상단)
              수정 시 ReasonModal 필수
```

### 2.6 고객지원 (D1 이용가이드 / D2 용어사전 / D3 FAQ)

```typescript
// D2 용어사전: 11개 seed 표시
// 알파벳·가나다 필터 탭
// 카드 or 아코디언 형태
용어 목록: NPL, 자산확정일(Cut-off Date), 매각대상자산, Data Disk,
           Invitation Letter(IL), LOI, NDA, 적격 투자자,
           Bid Package, LSPA, Interim
```

### 2.7 관리자 페이지 (Z1 회원관리 / Z2 상담관리)

```typescript
// Z1 회원 관리
테이블 컬럼: 가입일 / 이름 / 회사명 / 이메일 / 역할 / 인증상태Badge / [인증처리] [역할변경]
인증 처리:   [인증처리] 버튼 → confirm 모달 → PATCH /users/{id}/verify
             인증 완료 시 role=pending → role 설정 필요

// Z2 상담 관리  
탭:          매각 상담 | 인수 상담
테이블:      신청일 / 신청자 / 회사명 / 상담 제목 / 상태Badge / [답변]
답변 모달:   제목(읽기전용) + 내용(읽기전용) + 답변 입력 textarea
```

---

## 3. 재사용 컴포넌트 구현 패턴

### ProcessSteps (프로세스 4단계)
```typescript
// components/ui/ProcessSteps.tsx
interface Step { step: string; title: string; desc: string; }

export function ProcessSteps({ steps }: { steps: Step[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      {steps.map((s, i) => (
        <div key={i} className="relative">
          {/* 연결선 (마지막 제외) */}
          {i < steps.length - 1 && (
            <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-[#DEDEDE]" />
          )}
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-[#D04A02] text-white flex items-center justify-center font-bold text-lg">
              {s.step}
            </div>
            <h4 className="text-h3 font-heading text-[#2D2D2D] mt-4">{s.title}</h4>
            <p className="text-body-sm text-[#7D7D7D] mt-2">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### AssetTypeCard (자산 유형)
```typescript
// components/service/AssetTypeCard.tsx
export function AssetTypeCard({ type, desc }: { type: string; desc: string }) {
  return (
    <div className="border border-[#DEDEDE] rounded p-8 hover:border-[#D04A02] transition-colors">
      <h3 className="text-h3 font-heading text-[#2D2D2D]">{type}</h3>
      <p className="text-body-sm text-[#7D7D7D] mt-3 leading-relaxed">{desc}</p>
    </div>
  )
}
```

### Section 래퍼
```typescript
// components/layout/Section.tsx
type BgVariant = 'white' | 'gray' | 'dark'
const BG = { white: 'bg-white', gray: 'bg-[#F5F5F5]', dark: 'bg-[#2D2D2D]' }

export function Section({
  children, bg = 'white', className = '', divider = false
}: {
  children: React.ReactNode
  bg?: BgVariant
  className?: string
  divider?: boolean   // 하단 오렌지 라인 여부
}) {
  return (
    <section className={`${BG[bg]} py-16 md:py-24 ${divider ? 'pwc-divider' : ''} ${className}`}>
      <div className="max-w-5xl mx-auto px-8">
        {children}
      </div>
    </section>
  )
}
```

### PageHeader
```typescript
// components/layout/PageHeader.tsx
export function PageHeader({
  overline, title, subtitle
}: {
  overline?: string; title: string; subtitle?: string
}) {
  return (
    <div className="bg-[#2D2D2D] pwc-divider">
      <div className="max-w-5xl mx-auto px-8 py-16">
        {overline && (
          <p className="text-caption font-medium tracking-[0.12em] uppercase text-white opacity-60">
            {overline}
          </p>
        )}
        <h1 className="text-h1 font-heading text-white mt-3">{title}</h1>
        {subtitle && (
          <p className="text-body-lg text-white opacity-75 mt-4 max-w-[560px]">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
```

---

## 4. 접근성 & 반응형 체크리스트

```
접근성:
  ✓ 모든 인터랙티브 요소 :focus-visible 오렌지 링
  ✓ 색상만으로 상태 구분 금지 → 아이콘 또는 텍스트 병행
  ✓ 이미지 alt 텍스트 필수
  ✓ form label-input 연결 (htmlFor / id)
  ✓ 모달 포커스 트랩 (ESC 닫기 포함)
  ✓ 테이블 thead scope="col"

반응형:
  ✓ 테이블: overflow-x-auto 래퍼 필수
  ✓ 히어로 텍스트: text-display → md:text-display (모바일 28px)
  ✓ 카드 그리드: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
  ✓ 폼: 단일 컬럼 (모바일) → 2컬럼 (md 이상)
  ✓ Navbar: 모바일 hamburger 메뉴
  ✓ 모달: 모바일 전체화면 또는 바텀시트 고려
```

---

## 5. 작업 범위 외 (다른 Agent 담당)

```
❌ API 엔드포인트 구현     → agents/backend.md
❌ 인증·권한 로직          → agents/security.md
❌ DB 스키마·마이그레이션  → agents/infra.md
❌ 파일 업로드 처리 로직   → skills/file-upload.md
❌ RBAC 마스킹 쿼리        → skills/rbac-masking.md
```

Design Agent는 **UI 컴포넌트 코드와 페이지 레이아웃만** 담당한다.
데이터 페칭은 `api.ts` 유틸을 호출하는 수준까지만 작성하고,
실제 API 구현은 Backend Agent에 위임한다.
