# Skill: Design System — 삼일PwC 브랜드 벤치마크

> 레퍼런스: https://www.pwc.com/kr/ko/
> PwC 글로벌 브랜드 가이드라인 + 삼일PwC 코리아 웹사이트 시각 언어 기반.
> **컴포넌트 구현 전 반드시 이 파일을 먼저 읽어라.**
> 색상·폰트·여백을 임의로 정하지 말고, 이 파일의 토큰을 사용하라.

---

## 1. 컬러 토큰

### 브랜드 원색 (PwC 공식)
| 역할 | CSS 변수 | HEX | 사용처 |
|---|---|---|---|
| Primary | `--pwc-orange` | `#D04A02` | CTA 버튼, 링크 포인트, 섹션 구분 라인 |
| Primary Hover | `--pwc-orange-lt` | `#EB8C00` | 버튼 hover, 그라데이션 보조 |
| Accent | `--pwc-yellow` | `#FFB600` | 배지, 경고 하이라이트 |
| Danger | `--pwc-red` | `#E0301E` | 오류 상태, 삭제 버튼, cancelled |
| Danger Dark | `--pwc-red-dark` | `#A32020` | 심각 오류 hover |

### 중립색 (UI 뼈대)
| CSS 변수 | HEX | 사용처 |
|---|---|---|
| `--gray-900` | `#1A1A1A` | 거의 사용 안 함 |
| `--gray-800` | `#2D2D2D` | 헤딩, **다크 섹션 배경** (히어로·페이지헤더·CTA) |
| `--gray-700` | `#464646` | 서브텍스트, 테이블 행 아이콘 |
| `--gray-500` | `#7D7D7D` | placeholder, 비활성, 미공개 필드 "—" |
| `--gray-200` | `#DEDEDE` | 구분선, 보더, 테이블 선 |
| `--gray-100` | `#F5F5F5` | 카드 배경, 짝수 행, 필터 바 배경 |
| `--gray-050` | `#FAFAFA` | 아주 연한 배경 (교차 섹션) |
| `--white` | `#FFFFFF` | 기본 배경, 카드, 모달 |

### 상태 컬러 (NPL 플랫폼 전용)
```typescript
// components/ui/status.ts — 이 객체만 사용, 임의 색 추가 금지
export const STATUS_STYLE = {
  // Pool 상태
  active:    { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', label: '진행' },
  closed:    { bg: '#F5F5F5', text: '#464646', border: '#DEDEDE', label: '종결' },
  cancelled: { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA', label: '중단/유찰' },
  // 상담 상태
  pending:   { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', label: '답변 대기' },
  replied:   { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', label: '답변 완료' },
  // 회원 인증
  verified:   { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', label: '인증' },
  unverified: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', label: '미인증' },
} as const;
export type StatusKey = keyof typeof STATUS_STYLE;
```

---

## 2. 타이포그래피

### 폰트 패밀리 (PwC 공식 → 한국어 대체)
```
PwC 글로벌 공식:  Georgia (헤딩) + Arial (본문)
한국어 웹 구현:   Noto Serif KR (헤딩) + Noto Sans KR (본문)
```

```typescript
// app/layout.tsx
import { Noto_Serif_KR, Noto_Sans_KR } from 'next/font/google'
const serif = Noto_Serif_KR({ subsets: ['latin'], weight: ['400','600','700'], variable: '--font-serif' })
const sans  = Noto_Sans_KR({ subsets: ['latin'], weight: ['400','500','600'], variable: '--font-sans' })
// <html className={`${serif.variable} ${sans.variable}`}>
```

```css
/* app/globals.css */
:root {
  --font-heading: var(--font-serif), Georgia, serif;
  --font-body:    var(--font-sans), Arial, sans-serif;
}
body   { font-family: var(--font-body); }
h1,h2,h3 { font-family: var(--font-heading); }
```

### 타입 스케일
| Tailwind 클래스 | px | 두께 | line-height | 용도 |
|---|---|---|---|---|
| `text-display` | 48px | 700 | 1.15 | 히어로 대제목 |
| `text-h1` | 36px | 700 | 1.25 | 페이지 제목 |
| `text-h2` | 28px | 600 | 1.3 | 섹션 제목 |
| `text-h3` | 20px | 600 | 1.4 | 카드 제목 |
| `text-body-lg` | 18px | 400 | 1.65 | 히어로 서브카피, 리드 문장 |
| `text-body` | 16px | 400 | 1.6 | 본문 기본 |
| `text-body-sm` | 14px | 400 | 1.5 | 테이블 셀, 폼 레이블 |
| `text-caption` | 12px | 400 | 1.4 | 날짜, overline, 메타 |

### Overline 패턴 (PwC 특징)
```html
<!-- 섹션·페이지 헤더에서 대제목 위에 표시되는 작은 라벨 -->
<!-- 예: "서비스 소개" → "매각 자문" -->
<p class="text-caption font-medium tracking-[0.12em] uppercase opacity-60">서비스 소개</p>
<h1 class="text-h1 font-heading mt-3">매각 자문</h1>
```

---

## 3. 간격 시스템 (4px Grid)

```
4px   → 배지 내부 패딩 최소치
8px   → 인라인 요소 사이
12px  → 폼 input 패딩
16px  → 카드 내부 (소형)
24px  → 컴포넌트 사이
32px  → 카드 내부 (표준), 섹션 내 그룹 간
48px  → 섹션 상하 패딩 (모바일 py-12)
64px  → 섹션 상하 패딩 (데스크톱 py-16)
96px  → 대형 섹션 (히어로, CTA py-24)
```

---

## 4. 레이아웃 컨테이너

```css
.container       { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
.container-sm    { max-width: 768px; }    /* 폼, 상세 뷰 */
.container-lg    { max-width: 1440px; }   /* 풀 블리드 내부 */
```

```
반응형 브레이크포인트:
  sm:  640px  — 모바일 (카드 1컬)
  md:  768px  — 태블릿 (카드 2컬)
  lg: 1024px  — 데스크톱 (3컬, 테이블 풀)
  xl: 1280px  — 와이드
```

---

## 5. 컴포넌트 스펙

### 5.1 Navbar
```
높이: 64px | sticky top-0 | z-50 | bg-white
하단: border-b border-[#DEDEDE]

[좌] PwC 오렌지 워드마크 + "NPL 센터" (font-heading, gray-800, 18px)
[중] 메뉴: 홈 / 매각 자문 / 인수 자문 / 거래현황 / 고객지원
     font-body-sm gray-700 | 호버 → color: pwc-orange + underline
     활성 페이지 → color: pwc-orange, font-weight: 600
[우] 비로그인: [로그인] ghost | [회원가입] outline-orange
    로그인 후: 이름+역할 | [마이페이지] | [로그아웃]
              관리자: [관리자페이지] 추가
```

### 5.2 히어로 섹션 (홈 A 전용)
```
배경: #2D2D2D
최소 높이: min-h-[calc(100vh-64px)] 또는 min-h-[600px]
하단 오렌지 라인: border-b-4 border-[#D04A02]  ← 반드시 포함

레이아웃: 텍스트 좌측 정렬, max-w-[600px]
패딩: px-8 py-24 (96px 상하)

[overline]  text-caption tracking-[0.12em] uppercase text-white opacity-60
[h1]        text-display font-heading text-white mt-4 leading-[1.15]
[서브카피]  text-body-lg text-white opacity-80 mt-6
[CTA 버튼] mt-10 flex gap-4
  주 버튼: bg-[#D04A02] text-white px-8 py-3.5 font-semibold
  보조 버튼: border-2 border-white text-white px-8 py-3.5 font-semibold
            hover:bg-white hover:text-[#2D2D2D]
```

### 5.3 버튼 4종
```typescript
// 이 4가지 외 임의 variant 금지
const BUTTON = {
  primary:   'bg-[#D04A02] text-white hover:bg-[#EB8C00]',
  secondary: 'border-2 border-[#D04A02] text-[#D04A02] hover:bg-[#D04A02] hover:text-white',
  ghost:     'text-[#D04A02] hover:underline',
  danger:    'bg-[#E0301E] text-white hover:bg-[#A32020]',
}
// 공통: rounded px-6 py-3 font-semibold transition-colors duration-150
// size-sm: px-4 py-2 text-sm
// size-lg: px-8 py-4 text-lg
// disabled: opacity-40 cursor-not-allowed pointer-events-none
```

### 5.4 카드
```
bg-white
border: 1px solid #DEDEDE
border-radius: 4px  ← 절대 8px 이상 금지 (PwC sharp corner)
padding: 32px
box-shadow: 0 2px 8px rgba(0,0,0,0.06)
hover: border-color → #D04A02 | box-shadow → 0 4px 16px rgba(0,0,0,0.12)
transition: all 200ms ease

[서비스 카드]
  아이콘 (32px, color: #D04A02)
  h3 (gray-800, mt-4)
  설명 (body, gray-700, mt-2)
  링크 (body-sm, #D04A02, mt-6) → "자세히 보기 →"

[특장점 카드]
  아이콘 (48px, color: #D04A02)
  h3 (gray-800, mt-4, text-center)
  설명 (body-sm, gray-700, mt-2, text-center)
```

### 5.5 페이지 헤더 (서비스·운영 서브페이지)
```
bg-[#2D2D2D]
padding: px-8 py-16
border-bottom: 4px solid #D04A02  ← 오렌지 하단 라인 필수

[overline] text-caption tracking-[0.12em] uppercase text-white opacity-60
[h1]       text-h1 font-heading text-white mt-3
[서브]     text-body-lg text-white opacity-75 mt-4 max-w-[560px]
```

### 5.6 섹션 교차 패턴 (PwC 코리아 핵심 패턴)
```
콘텐츠 섹션은 반드시 배경을 교차시킨다:
  섹션 1: bg-white        (서비스 카드, 자산 유형)
  섹션 2: bg-[#F5F5F5]   (프로세스, 특장점)
  섹션 3: bg-white        (상담 CTA, 추가 내용)
  섹션 N: bg-[#2D2D2D]   (하단 강조 CTA, 다크 섹션)

각 섹션 패딩: py-16 md:py-24
컨테이너:    max-w-5xl mx-auto px-8
```

### 5.7 테이블
```
[헤더 행]
  bg-[#2D2D2D] text-white
  font: text-body-sm font-semibold
  padding: px-4 py-3
  text-align: 문자열 left | 숫자·날짜 right

[데이터 행]
  홀수: bg-white | 짝수: bg-[#FAFAFA]
  hover: bg-[#FFF5EE]  (연한 오렌지 tint)
  border-bottom: 1px solid #DEDEDE
  padding: px-4 py-3
  font: text-body-sm

[특수 셀]
  미공개 필드: "—" text-[#7D7D7D] italic
  금액(OPB): font-variant-numeric: tabular-nums, text-right
  링크: text-[#D04A02] hover:underline

[액션 버튼]
  [보기] text-[#D04A02] text-body-sm hover:underline
  [수정] text-[#464646] text-body-sm hover:underline
  [삭제] text-[#E0301E] text-body-sm hover:underline
  구분: | (gray-200)
```

### 5.8 폼
```
[Label]
  text-body-sm font-semibold text-[#2D2D2D] mb-1
  필수(*): text-[#E0301E] ml-0.5

[Input / Textarea / Select]
  border: 1px solid #DEDEDE
  border-radius: 4px
  padding: 10px 14px
  font: text-body text-[#2D2D2D]
  bg: white
  :focus   → border-[#D04A02] + ring-2 ring-[#D04A02]/20
  :invalid → border-[#E0301E] bg-[#FEF9F9]
  :disabled→ bg-[#F5F5F5] cursor-not-allowed text-[#7D7D7D]
  placeholder: text-[#7D7D7D]

[에러 메시지]
  text-caption text-[#E0301E] mt-1

[폼 섹션 그룹]  ← Pool 상세 입력처럼 큰 폼에서 사용
  border: 1px solid #DEDEDE | border-radius: 4px | padding: 24px
  섹션 헤딩: text-h3 font-heading text-[#2D2D2D]
             + border-b border-[#DEDEDE] pb-3 mb-6
```

### 5.9 Status Badge
```typescript
// components/ui/StatusBadge.tsx
import { STATUS_STYLE, StatusKey } from '@/components/ui/status'

export function StatusBadge({ status }: { status: StatusKey }) {
  const { bg, text, border, label } = STATUS_STYLE[status]
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
      style={{ backgroundColor: bg, color: text, borderColor: border }}
    >
      {label}
    </span>
  )
}
```

### 5.10 모달
```
오버레이: fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20
패널:     bg-white border-radius: 4px max-w-[520px] w-full
          box-shadow: 0 8px 32px rgba(0,0,0,0.18)

[헤더]  px-6 pt-6 pb-4 border-b border-[#DEDEDE]
        text-h3 font-heading gray-800
        [X] absolute top-4 right-4 text-gray-500 hover:text-gray-800

[바디]  px-6 py-5

[푸터]  px-6 pb-6 pt-4 border-t border-[#DEDEDE]
        flex justify-end gap-3
        [취소] secondary-sm | [확인] primary-sm
```

### 5.11 Toast 알림
```
위치: fixed bottom-6 right-6 z-50
크기: max-w-[360px] w-full
배경: white | border-radius: 4px | padding: 16px
box-shadow: 0 4px 16px rgba(0,0,0,0.12)
border-left: 4px solid [상태색]

성공: border-l-[#166534] | 아이콘 CheckCircle green
오류: border-l-[#E0301E] | 아이콘 XCircle red
경고: border-l-[#EB8C00] | 아이콘 AlertCircle orange
정보: border-l-[#1D4ED8] | 아이콘 Info blue
```

---

## 6. 페이지별 레이아웃 패턴

### 홈 (A) — 마케팅 랜딩
```
Navbar (sticky 64px)
├── Hero             bg:#2D2D2D  min-h:[600px]  py-24
│   └── [오렌지 라인 4px]
├── 서비스 카드 2개  bg:white    py-24
├── 특장점 3개       bg:#F5F5F5  py-24
└── 하단 CTA         bg:#2D2D2D  py-20  text-center
Footer
```

### 서비스 소개 (B1/B2) — 콘텐츠 페이지
```
Navbar
├── PageHeader       bg:#2D2D2D  py-16  [오렌지 라인 4px]
├── 자산 유형 3카드  bg:white    py-16
├── 프로세스 4단계   bg:#F5F5F5  py-16
└── 상담 CTA         bg:white    py-16  text-center
Footer
```

### 운영 페이지 (C, D, Z) — 대시보드형
```
Navbar
├── 페이지 제목 바   bg:white  px-8 py-5  border-b
├── 필터/탭 바       bg:#F5F5F5  px-8 py-3  border-b
├── 테이블/콘텐츠    bg:white  px-8 py-6
└── 페이지네이션     px-8 py-4
Footer (최소)
```

### 상세 폼 (C2-2 Pool 상세, C3 거래자료)
```
Navbar
Breadcrumb (px-8 py-3 bg:#F5F5F5 border-b, text-body-sm gray-500)
├── max-w-4xl mx-auto px-8 py-8
│   ├── 폼 섹션 카드 × N (border, padding-6, 2컬 그리드)
│   └── 하단 [저장] primary | [취소] ghost
Footer (최소)
```

---

## 7. tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pwc: {
          orange:     '#D04A02',
          'orange-lt':'#EB8C00',
          yellow:     '#FFB600',
          red:        '#E0301E',
          'red-dark': '#A32020',
        },
      },
      fontFamily: {
        heading: ['var(--font-serif)', 'Georgia', 'serif'],
        sans:    ['var(--font-sans)',  'Arial',   'sans-serif'],
      },
      fontSize: {
        'display': ['3rem',     { lineHeight: '1.15', fontWeight: '700' }],
        'h1':      ['2.25rem',  { lineHeight: '1.25', fontWeight: '700' }],
        'h2':      ['1.75rem',  { lineHeight: '1.3',  fontWeight: '600' }],
        'h3':      ['1.25rem',  { lineHeight: '1.4',  fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.65'                    }],
        'body-sm': ['0.875rem', { lineHeight: '1.5'                     }],
        'caption': ['0.75rem',  { lineHeight: '1.4'                     }],
      },
      borderRadius: {
        DEFAULT: '4px',
        sm:  '2px',
        md:  '4px',
        lg:  '6px',    // 플랫폼 최대치 — 절대 초과 금지
        full:'9999px', // 배지 전용
      },
      boxShadow: {
        card:        '0 2px 8px rgba(0,0,0,0.06)',
        'card-hover':'0 4px 16px rgba(0,0,0,0.12)',
        modal:       '0 8px 32px rgba(0,0,0,0.18)',
      },
    },
  },
} satisfies Config
```

---

## 8. globals.css

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --pwc-orange:    #D04A02;
  --pwc-orange-lt: #EB8C00;
  --pwc-red:       #E0301E;
  --gray-800:      #2D2D2D;
  --gray-200:      #DEDEDE;
  --gray-100:      #F5F5F5;
}

body {
  color: #2D2D2D;
  background: #FFFFFF;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* PwC 브랜드 포커스 링 */
:focus-visible {
  outline: 2px solid var(--pwc-orange);
  outline-offset: 2px;
}

/* 오렌지 라인 유틸리티 */
@layer utilities {
  .pwc-divider { border-bottom: 4px solid var(--pwc-orange); }
  .font-heading { font-family: var(--font-heading, Georgia, serif); }
}
```

---

## 9. 공통 컴포넌트 구현 순서 (Phase 1 필수)

```
1순위 — 레이아웃 뼈대
  components/layout/Navbar.tsx
  components/layout/Footer.tsx
  components/layout/PageHeader.tsx    ← 다크 배경 헤더 (B1/B2/서브페이지)
  components/layout/Section.tsx       ← white/gray-100 교차 래퍼

2순위 — 공통 UI
  components/ui/Button.tsx            ← 4 variant + size
  components/ui/StatusBadge.tsx       ← STATUS_STYLE 기반
  components/ui/Card.tsx              ← hover 효과 포함
  components/ui/Input.tsx             ← focus/error/disabled 상태
  components/ui/Modal.tsx
  components/ui/Toast.tsx

3순위 — 도메인 컴포넌트
  components/home/HeroSection.tsx
  components/home/ServiceCard.tsx
  components/home/FeatureCard.tsx
  components/consulting/ConsultingButton.tsx
  components/consulting/ConsultingModal.tsx
  components/pools/PoolTable.tsx
  components/pools/PoolStatusBadge.tsx
  components/ui/ReasonModal.tsx        ← PATCH 공통
```

---

## 10. 금지 사항 (Anti-patterns)

```
❌ border-radius > 6px              PwC는 sharp corner 정체성
❌ 오렌지 외 색을 브랜드 포인트로  오렌지가 유일한 시그니처
❌ 토큰에 없는 색 하드코딩          임의 #hex 추가 금지
❌ 그림자 중복·과도 사용            flat + subtle이 PwC 스타일
❌ 다크 배경에 오렌지 텍스트        대비 부족, 가독성 문제
❌ 운영 페이지에 마케팅 스타일      반대도 마찬가지
❌ 모바일 테이블 수평 스크롤 미처리 overflow-x-auto 필수
❌ border-radius: 8px 이상 카드     lg(6px)가 플랫폼 최대치
```
