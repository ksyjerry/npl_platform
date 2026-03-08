# Instruction: 홈페이지 콘텐츠 개선

## 배경 및 목적

현재 홈페이지 콘텐츠는 아래 두 가지 문제가 있다.

1. **카피가 업계 클리셰** — "디지털화", "투명성", "효율성" 같은 표현은 
   어느 SaaS 랜딩페이지에나 있다. 삼일PwC만의 강점이 전혀 보이지 않는다.

2. **방문자 입장이 없음** — 매도인(금융기관)과 매수인(F&I·자산운용사)은 
   서로 다른 니즈를 갖는다. 지금 카피는 두 그룹 모두에게 와 닿지 않는다.

이 instruction은 각 섹션별로 **교체할 콘텐츠를 명시**한다.
디자인·레이아웃은 기존 설계(`skills/design-system.md`) 그대로 유지하고
텍스트 값만 교체한다.

---

## 섹션별 교체 콘텐츠

### 섹션 1 — Hero

**교체 전 (현재):**
```
overline:  "Samil PricewaterhouseCoopers"
h1:        "NPL Platform"
서브카피:  "NPL 매각·인수 거래 프로세스를 디지털화하여 거래 투명성과 운영 효율성을 높입니다."
```

**교체 후:**
```
overline:  "Samil PricewaterhouseCoopers · NPL Advisory"
h1:        "국내 최대 NPL 자문사의\n거래 플랫폼"
서브카피:  "삼일PwC가 자문한 수백 건의 NPL 거래 경험을 디지털 플랫폼으로 제공합니다.\n매각부터 인수까지, 전 과정을 한 곳에서."
CTA1:      "매각 자문 상담"   → /service/selling
CTA2:      "인수 기회 탐색"   → /service/buying
```

**변경 이유:**
- overline에 "NPL Advisory"를 추가해 전문 자문 브랜드임을 즉시 전달
- h1을 "국내 최대 NPL 자문사"로 포지셔닝 — 삼일PwC의 시장 지위가 핵심 신뢰 근거
- 서브카피에서 "디지털화"라는 수단 대신 "수백 건의 거래 경험"이라는 결과를 앞세움
- CTA 문구를 행동 지향적으로 변경 ("매각 자문" → "매각 자문 상담", "인수 자문" → "인수 기회 탐색")

---

### 섹션 2 — 서비스 카드 2개

**교체 전 (현재):**
```
[매각 자문]
  "금융기관의 NPL 매각 전 과정을 삼일PwC 전문가가 지원합니다.
   자산실사부터 입찰 진행, 거래 종결까지 원스톱 자문 서비스를 제공합니다."
  링크: "자세히 보기 →"

[인수 자문]
  "F&I·자산운용사 등 적격 투자자의 NPL 인수를 지원합니다.
   딜 소싱부터 실사 지원, 입찰 참여까지 전문적인 자문을 제공합니다."
  링크: "자세히 보기 →"
```

**교체 후:**
```
[매각 자문]
  아이콘: 건물/금융 아이콘 (예: Building2 from lucide-react)
  제목: "매각 자문"
  설명: "은행·저축은행·캐피탈 등 금융기관의 부실채권 매각을 지원합니다.
         무담보·담보·PF 등 전 자산 유형, Data Disk 작성부터 LSPA 체결까지
         삼일PwC 전문가가 함께합니다."
  하단 태그: ["무담보 NPL", "담보 NPL", "PF 채권"]  ← 작은 회색 배지
  링크: "매각 상담 신청 →"   → /service/selling

[인수 자문]
  아이콘: 차트/투자 아이콘 (예: TrendingUp from lucide-react)
  제목: "인수 자문"
  설명: "F&I·자산운용사·기관투자자를 위한 NPL 딜 소싱 및 인수 자문입니다.
         적격 투자자 확인부터 Bid Package 검토, 입찰 참여까지
         삼일PwC의 네트워크와 경험을 활용하세요."
  하단 태그: ["딜 소싱", "입찰 지원", "LSPA 검토"]  ← 작은 회색 배지
  링크: "인수 상담 신청 →"   → /service/buying
```

**변경 이유:**
- "원스톱 자문 서비스" → 실제 업무 범위(Data Disk, LSPA)를 명시해 전문성 표현
- 자산 유형 태그를 추가해 방문자가 자신의 상황에 해당하는지 즉시 판단 가능
- 링크 문구를 "자세히 보기"에서 행동 유도("상담 신청")로 변경

**구현 방법:**
```typescript
// ServiceCard 컴포넌트에 tags?: string[] prop 추가
// 카드 하단에 태그 배지 렌더링
{tags && (
  <div className="flex flex-wrap gap-2 mt-4">
    {tags.map(tag => (
      <span key={tag}
        className="px-2 py-0.5 text-xs border border-[#DEDEDE] rounded text-[#7D7D7D]">
        {tag}
      </span>
    ))}
  </div>
)}
```

---

### 섹션 3 — 특장점 3개

**교체 전 (현재):**
```
섹션 제목: "삼일PwC NPL 플랫폼이 제공하는 가치"

🔒 거래 투명성
   "모든 거래 정보와 과정을 디지털로 기록하여 투명하고 신뢰할 수 있는 거래 환경을 제공합니다."

⚡ 딜 발굴 효율화
   "온라인 플랫폼을 통해 매각·인수 기회를 신속하게 발굴하고 효율적으로 거래를 진행할 수 있습니다."

📁 통합 자료 관리
   "거래 관련 모든 자료를 안전하게 관리하고, 역할별 접근 권한을 통해 보안을 유지합니다."
```

**교체 후:**
```
섹션 제목:    "왜 삼일PwC NPL 플랫폼인가"
섹션 부제목:  "국내 NPL 시장을 주도해온 삼일PwC의 자문 역량을 디지털 플랫폼에 담았습니다."
              (text-body gray-500, text-center, mb-12)

아이콘 라이브러리: lucide-react 사용

① 아이콘: Shield (lucide-react)
   제목: "검증된 자문 네트워크"
   설명: "국내 주요 금융기관·기관투자자와의 신뢰 네트워크를 기반으로
          적격 매수인을 신속하게 연결합니다."

② 아이콘: FileSearch (lucide-react)
   제목: "체계적인 거래 관리"
   설명: "Pool 등록부터 Data Disk, Invitation Letter, LSPA까지
          거래의 모든 단계를 단일 플랫폼에서 추적하고 관리합니다."

③ 아이콘: Lock (lucide-react)
   제목: "역할별 보안 접근"
   설명: "매도인·매수인·회계법인 각 역할에 맞게
          자료 접근 권한이 분리되어 정보 유출 위험을 차단합니다."
```

**변경 이유:**
- 섹션 제목 "제공하는 가치" → "왜 삼일PwC인가" — 경쟁 우위 포지셔닝으로 전환
- 부제목 추가로 삼일PwC의 시장 포지션 한 번 더 각인
- 특장점을 "플랫폼 기능" 중심에서 "삼일PwC 강점" 중심으로 재편
  - "거래 투명성(기능)" → "검증된 자문 네트워크(강점)"
  - "딜 발굴 효율화(기능)" → "체계적인 거래 관리(강점)"
  - "통합 자료 관리(기능)" → "역할별 보안 접근(강점)"
- 설명문에 NPL 전문 용어(Data Disk, IL, LSPA) 자연스럽게 삽입해 전문성 전달

---

### 섹션 4 — 하단 CTA

**교체 전 (현재):**
```
h2:   "지금 시작하세요"
설명: "삼일PwC의 NPL 전문가와 함께 최적의 거래 솔루션을 경험하세요."
버튼: [회원가입]  [로그인]
```

**교체 후:**
```
h2:   "NPL 거래, 지금 바로 시작하세요"
설명: "매각을 검토 중인 금융기관이든, 투자 기회를 찾는 기관투자자든
       삼일PwC NPL 플랫폼에서 전문가와 연결됩니다."
버튼1: [매각 상담 신청]   → /service/selling   (primary: bg-[#D04A02])
버튼2: [인수 상담 신청]   → /service/buying    (secondary: border-white)
버튼3: [회원가입]         → /auth/register     (ghost: text-white underline, 더 작은 크기)

버튼1·2 아래 별도 줄에:
  "이미 계정이 있으신가요?  로그인 →"
  (text-caption text-white opacity-60, /auth/login 링크)
```

**변경 이유:**
- h2 뒤에 "NPL 거래"를 명시해 무엇을 시작하는지 분명히 함
- 설명문에서 두 타겟(매도인/매수인)을 직접 언급해 각자 자신의 이야기임을 인식하게 함
- "회원가입/로그인" 2버튼 → 상담 신청 2버튼이 주 CTA, 회원가입·로그인은 보조 처리
  - 방문자의 첫 행동이 "회원가입"보다 "상담 신청"이 더 자연스러운 NPL B2B 맥락 반영

---

## 추가 구현 사항

### Navbar 로고 텍스트 수정

**현재:** "NPL 센터"
**변경:** "NPL Platform"

이유: 영문 브랜드명이 더 간결하고 PwC 글로벌 스타일에 부합

### 페이지 메타데이터 (SEO)

```typescript
// app/(public)/page.tsx
export const metadata = {
  title: 'NPL Platform | 삼일PwC',
  description: '삼일PwC NPL 매각·인수 자문 플랫폼. 국내 주요 금융기관과 기관투자자를 연결하는 NPL 전문 디지털 거래 플랫폼입니다.',
  openGraph: {
    title: 'NPL Platform | 삼일PwC',
    description: '삼일PwC NPL 매각·인수 자문 플랫폼',
    type: 'website',
  },
}
```

---

## 구현 요청 프롬프트 (Claude Code에 붙여넣기)

```
.claude/agents/design.md 와 .claude/skills/design-system.md 를 읽어.

홈페이지(app/(public)/page.tsx)의 텍스트 콘텐츠를 아래와 같이 교체해줘.
레이아웃·디자인·컴포넌트 구조는 변경하지 말고, 텍스트 값과 아이콘만 교체해.

─── Hero 섹션 ────────────────────────────────────────────
overline:  "Samil PricewaterhouseCoopers · NPL Advisory"
h1:        "국내 최대 NPL 자문사의\n거래 플랫폼"
서브카피:  "삼일PwC가 자문한 수백 건의 NPL 거래 경험을 디지털 플랫폼으로 제공합니다.\n매각부터 인수까지, 전 과정을 한 곳에서."
CTA1 텍스트: "매각 자문 상담"
CTA2 텍스트: "인수 기회 탐색"

─── 서비스 카드 ──────────────────────────────────────────
[매각 자문 카드]
  아이콘: Building2 (lucide-react)
  설명: "은행·저축은행·캐피탈 등 금융기관의 부실채권 매각을 지원합니다.
         무담보·담보·PF 등 전 자산 유형, Data Disk 작성부터 LSPA 체결까지
         삼일PwC 전문가가 함께합니다."
  tags: ["무담보 NPL", "담보 NPL", "PF 채권"]
  링크 텍스트: "매각 상담 신청 →"

[인수 자문 카드]
  아이콘: TrendingUp (lucide-react)
  설명: "F&I·자산운용사·기관투자자를 위한 NPL 딜 소싱 및 인수 자문입니다.
         적격 투자자 확인부터 Bid Package 검토, 입찰 참여까지
         삼일PwC의 네트워크와 경험을 활용하세요."
  tags: ["딜 소싱", "입찰 지원", "LSPA 검토"]
  링크 텍스트: "인수 상담 신청 →"

ServiceCard 컴포넌트에 tags?: string[] prop을 추가하고,
카드 하단에 작은 회색 배지로 렌더링해줘:
  <span className="px-2 py-0.5 text-xs border border-[#DEDEDE] rounded text-[#7D7D7D]">

─── 특장점 섹션 ──────────────────────────────────────────
섹션 h2: "왜 삼일PwC NPL 플랫폼인가"
섹션 부제목 추가 (h2 바로 아래):
  "국내 NPL 시장을 주도해온 삼일PwC의 자문 역량을 디지털 플랫폼에 담았습니다."
  className="text-body text-[#7D7D7D] text-center mt-3 mb-12"

[카드 1]
  아이콘: Shield (lucide-react, color: #D04A02, size: 40)
  제목: "검증된 자문 네트워크"
  설명: "국내 주요 금융기관·기관투자자와의 신뢰 네트워크를 기반으로
         적격 매수인을 신속하게 연결합니다."

[카드 2]
  아이콘: FileSearch (lucide-react, color: #D04A02, size: 40)
  제목: "체계적인 거래 관리"
  설명: "Pool 등록부터 Data Disk, Invitation Letter, LSPA까지
         거래의 모든 단계를 단일 플랫폼에서 추적하고 관리합니다."

[카드 3]
  아이콘: Lock (lucide-react, color: #D04A02, size: 40)
  제목: "역할별 보안 접근"
  설명: "매도인·매수인·회계법인 각 역할에 맞게
         자료 접근 권한이 분리되어 정보 유출 위험을 차단합니다."

─── 하단 CTA 섹션 ────────────────────────────────────────
h2: "NPL 거래, 지금 바로 시작하세요"
설명:
  "매각을 검토 중인 금융기관이든, 투자 기회를 찾는 기관투자자든
   삼일PwC NPL 플랫폼에서 전문가와 연결됩니다."

버튼 구성 (flex gap-4, justify-center):
  버튼1: [매각 상담 신청]  → /service/selling  (primary: bg-[#D04A02] text-white)
  버튼2: [인수 상담 신청]  → /service/buying   (secondary: border-2 border-white text-white)

버튼 아래 별도 줄에:
  <p className="mt-6 text-caption text-white opacity-60">
    이미 계정이 있으신가요?{" "}
    <Link href="/auth/login" className="underline hover:opacity-100">로그인 →</Link>
  </p>

─── Navbar ───────────────────────────────────────────────
로고 옆 텍스트: "NPL Platform" (현재 "NPL 센터"에서 변경)

─── 메타데이터 ───────────────────────────────────────────
app/(public)/page.tsx 상단에 export const metadata 추가:
  title: 'NPL Platform | 삼일PwC'
  description: '삼일PwC NPL 매각·인수 자문 플랫폼. 국내 주요 금융기관과 기관투자자를 연결하는 NPL 전문 디지털 거래 플랫폼입니다.'

─── 완료 후 확인 ─────────────────────────────────────────
localhost:3000 에서 다음을 확인해:
1. Hero h1 줄바꿈(\n)이 <br /> 또는 whitespace-pre-line으로 정상 렌더링되는지
2. 서비스 카드에 태그 배지가 표시되는지
3. 특장점 섹션 부제목이 h2 아래에 표시되는지
4. 하단 CTA 버튼 2개 + "로그인 →" 링크가 순서대로 표시되는지
5. 모바일(375px)에서 h1 텍스트 잘림 없는지 확인
   (text-display가 너무 크면 md:text-display, text-4xl로 조정)
```
