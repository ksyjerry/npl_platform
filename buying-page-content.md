# Instruction: 인수 자문 페이지 (B2) 콘텐츠 보강

## 배경 및 타겟 방문자

현재 `/service/buying` 페이지는 4개 섹션으로 구성되어 있으며
실질적인 콘텐츠가 부족하다.

```
현재: PageHeader → 자산유형 3카드(B1과 동일) → 적격 투자자 기준 + 프로세스 → CTA
문제: 매각 자문 페이지와 구조가 거의 동일하고, 매수인 입장의 콘텐츠가 없음
```

**타겟 방문자:** F&I·자산운용사·기관투자자의 투자 담당자.
이들은 이미 NPL 투자가 무엇인지 알고 있다.
그들에게 필요한 것은 세 가지다:
1. **이 플랫폼에 올라오는 딜이 어떤 것인가** (투자 기회의 질)
2. **삼일PwC가 어떻게 딜 접근을 도와주는가** (차별화된 지원)
3. **입찰 참여 절차가 얼마나 간편한가** (진입 장벽 해소)

## 매각 자문과의 핵심 차이

| 항목 | 매각 자문 (B1) | 인수 자문 (B2) |
|---|---|---|
| 방문자 | 금융기관 여신·자산관리 담당자 | F&I·자산운용사 투자 담당자 |
| 핵심 니즈 | "내 채권을 얼마에 팔 수 있나" | "어떤 딜이 올라오나, 어떻게 참여하나" |
| Why PwC | 자문 네트워크·평가 역량 | 딜 소싱 독점성·검증된 Data Disk 품질 |
| 프로세스 초점 | 자산 실사·MRP 산정 | 적격 투자자 등록·Bid Package 검토 |
| 차별화 포인트 | 법적 리스크 관리 | 온라인 입찰 편의성·정보 비대칭 해소 |

---

## 개선된 페이지 구조 (7섹션)

```
① PageHeader         — 포지셔닝 강화 (투자자 관점)
② 투자 대상 자산     — 자산 유형 + 투자 매력도 설명
③ 삼일PwC 강점       — Why PwC for Buyers (신규, 매각과 다른 내용)
④ 입찰 참여 프로세스 — 5단계로 확장 + 각 단계 상세
⑤ 적격 투자자 기준   — 기존 간단 리스트 → 상세 카드로 격상 (신규)
⑥ 자주 묻는 질문     — 매수인 특화 FAQ (신규)
⑦ CTA               — 상담 신청
```

---

## 섹션별 상세 콘텐츠

### ① PageHeader

```
overline:  "서비스 소개 · 인수 자문"
title:     "NPL 인수 자문"
subtitle:  "삼일PwC의 검증된 딜 소싱 채널을 통해
            국내 주요 NPL 매각 기회에 가장 먼저 접근하세요."
```

**매각 자문과의 차이:**
- subtitle이 "지원합니다"(서비스 제공자 시점) → "접근하세요"(투자자 행동 유도)로 전환
- "검증된 딜 소싱 채널"을 전면에 내세워 독점적 접근 기회임을 강조

---

### ② 투자 대상 자산

섹션 제목: `"투자 대상 자산 유형"`
섹션 부제목: `"삼일PwC가 자문하는 NPL Pool은 엄격한 데이터 검증을 거칩니다."`

카드 3개 — 매수인 투자 관점에서 재서술:

```
[카드 1] 무담보 NPL
  아이콘: Users (lucide-react)
  제목: "무담보 NPL"
  설명: "개인 신용·카드·할부 부실채권으로 구성된 Pool입니다.
         회수율 데이터가 풍부하고 포트폴리오 다각화에 적합합니다.
         CCRS·IRL 등 정상화 채권도 포함됩니다."
  배지: ["CCRS", "IRL", "일반 무담보"]

[카드 2] 담보 NPL
  아이콘: Building (lucide-react)
  제목: "담보 NPL"
  설명: "부동산 담보가 설정된 부실채권으로 상대적으로 회수 가능성이 높습니다.
         담보물 감정평가서와 법적 상태가 Data Disk에 포함되어
         투자 판단에 필요한 정보를 충분히 제공합니다."
  배지: ["아파트 담보", "상업용 부동산", "Special Asset"]

[카드 3] PF 채권
  아이콘: Landmark (lucide-react)
  제목: "PF 채권"
  설명: "프로젝트 파이낸싱 관련 부실채권으로 사업장 현황·분양률·
         시행사 재무 상태 등 상세 자료가 제공됩니다.
         고수익을 추구하는 기관투자자에게 적합합니다."
  배지: ["주거용 PF", "상업용 PF", "브릿지론"]
```

하단 노트 (border-l-4 border-[#FFB600] bg-[#FFFBF0] pl-4 py-3 mt-8):
```
"삼일PwC NPL 플랫폼에 등록되는 모든 Pool은 담당자의 데이터 검증을 거친 후 공개됩니다.
 Data Disk 품질과 법적 리스크 검토가 사전에 완료된 딜만 진행됩니다."
```

**B1과의 차이:** 설명 관점이 "매각인이 갖고 있는 자산" → "투자자가 살 수 있는 자산"으로 전환.
회수율·데이터 품질·투자 적합성을 부각.

---

### ③ 왜 삼일PwC인가 — 매수인 관점 (신규)

섹션 배경: `bg-[#2D2D2D]` (다크)
섹션 제목: `"삼일PwC를 통해 인수하는 이유"` (text-white)
섹션 부제목: `"단순 플랫폼이 아닙니다. 검증된 딜에 가장 먼저 접근하는 채널입니다."` (text-white opacity-70)

강점 4개 — 2×2 그리드 (StrengthCard 컴포넌트, B1과 동일 컴포넌트 재사용):

```
[강점 1]
  아이콘: Zap (lucide-react, color: #D04A02)
  제목: "선제적 딜 접근"
  설명: "삼일PwC는 국내 주요 금융기관과의 직접 자문 관계를 통해
         시장에 공개되기 전 단계부터 딜 정보를 확보합니다.
         적격 투자자로 등록되면 Invitation Letter를 우선 수령합니다."

[강점 2]
  아이콘: FileSearch (lucide-react, color: #D04A02)
  제목: "검증된 Data Disk 품질"
  설명: "삼일PwC 담당자가 직접 검토한 Data Disk를 제공합니다.
         채권 데이터의 정확성, 담보물 현황, 법적 상태가
         사전 검증되어 투자자의 실사 부담을 줄입니다."

[강점 3]
  아이콘: Users (lucide-react, color: #D04A02)
  제목: "공정한 입찰 프로세스"
  설명: "온라인 플랫폼을 통해 입찰 정보와 일정을 투명하게 공개합니다.
         모든 적격 투자자에게 동일한 정보를 동시에 제공하여
         공정한 경쟁 환경을 보장합니다."

[강점 4]
  아이콘: Headphones (lucide-react, color: #D04A02)
  제목: "입찰 전 과정 지원"
  설명: "NDA·LOI 절차부터 Bid Package 검토, 입찰서류 제출까지
         삼일PwC 담당자가 단계별로 안내합니다.
         NPL 투자 경험이 적은 기관도 참여 가능합니다."
```

---

### ④ 입찰 참여 프로세스 (4단계 → 5단계 확장)

섹션 배경: `bg-[#F5F5F5]`
섹션 제목: `"입찰 참여 프로세스"`
섹션 부제목: `"상담 신청부터 거래 종결까지 체계적으로 안내합니다."`

ProcessSteps 5단계:

```typescript
steps={[
  {
    step: "01",
    title: "인수 상담 신청",
    desc: "투자 관심 자산 유형, 희망 규모, 투자 기준을 공유합니다.\n삼일PwC 담당자가 영업일 2일 이내 연락드립니다."
  },
  {
    step: "02",
    title: "적격 투자자 확인",
    desc: "투자자 자격 검토 후 NDA(비밀유지서약서)를 체결합니다.\nInvitation Letter(IL)를 수령하면 입찰 참여 자격이 부여됩니다."
  },
  {
    step: "03",
    title: "Bid Package 수령",
    desc: "Data Disk, LSPA 초안, 입찰 지침서가 포함된 Bid Package를 수령합니다.\n플랫폼을 통해 안전하게 다운로드할 수 있습니다."
  },
  {
    step: "04",
    title: "입찰서류 제출",
    desc: "입찰참가의향서(LOI)와 입찰가격을 플랫폼에서 온라인으로 제출합니다.\n입찰기일 내 제출하면 자동으로 접수 확인이 발송됩니다."
  },
  {
    step: "05",
    title: "우선협상 및 거래 종결",
    desc: "낙찰 시 LSPA 조건을 협의하고 거래를 종결합니다.\nInterim 정산 완료 후 채권이 양수됩니다."
  },
]}
```

---

### ⑤ 적격 투자자 기준 (기존 간단 리스트 → 카드로 격상)

섹션 배경: `bg-white`
섹션 제목: `"적격 투자자 기준"`
섹션 부제목: `"아래 기준을 충족하는 기관이라면 상담 신청 후 적격 여부를 확인받을 수 있습니다."`

**기존:** 체크 3개짜리 짧은 리스트
**변경:** 기준 카드 3개 + 하단 안내 문구

```
카드 레이아웃: grid-cols-1 md:grid-cols-3 gap-6
각 카드: border border-[#DEDEDE] rounded p-6, 상단 border-t-4 border-[#D04A02]

[카드 1]
  아이콘: Building2 (lucide-react, color: #D04A02)
  제목: "기관 투자자"
  항목:
    • 자산운용사, F&I(자산관리회사)
    • 저축은행, 캐피탈, 보험사
    • 기타 금융기관 및 적격 법인
  하단: "개인 투자자는 참여가 불가합니다."  (text-caption gray-500)

[카드 2]
  아이콘: Award (lucide-react, color: #D04A02)
  제목: "투자 역량"
  항목:
    • NPL 또는 부실자산 투자 경험 보유
    • 자체 실사 및 가치평가 능력
    • 내부 투자심의 절차 및 리스크 관리 체계 보유
  하단: "경험이 부족한 경우 삼일PwC 자문 지원이 가능합니다."  (text-caption gray-500)

[카드 3]
  아이콘: FileCheck (lucide-react, color: #D04A02)
  제목: "서류 요건"
  항목:
    • NDA(비밀유지서약서) 체결 가능한 법인
    • LOI(입찰참가의향서) 제출 가능
    • 입찰 참여 시 필요한 법인 서류 제출
  하단: "서류 양식은 적격 투자자 확인 후 안내드립니다."  (text-caption gray-500)
```

하단 강조 박스 (bg-[#FFF5EE] border border-[#D04A02] rounded p-5 mt-8 max-w-2xl mx-auto):
```
"기준 충족 여부가 불확실한 경우에도 상담 신청 후 확인이 가능합니다.
 삼일PwC 담당자가 검토 후 안내드립니다."
```

---

### ⑥ 자주 묻는 질문 (신규 — 매수인 특화)

섹션 배경: `bg-[#F5F5F5]`
섹션 제목: `"자주 묻는 질문"`

Accordion 5개 (components/ui/Accordion.tsx — selling 페이지에서 이미 생성됨):

```
Q1. "현재 입찰 가능한 딜 목록은 어디서 볼 수 있나요?"
A1. "회원가입 후 관리자 인증을 받으면 '거래현황' 메뉴에서
     현재 진행 중인 Pool 목록을 확인할 수 있습니다.
     Pool별 자산 유형, 규모, 입찰기일 등 기본 정보가 제공됩니다."

Q2. "입찰에 참여하려면 반드시 NDA를 체결해야 하나요?"
A2. "네. Invitation Letter 수령 및 Data Disk 열람을 위해서는
     NDA(비밀유지서약서) 체결이 필수입니다.
     NDA 양식은 담당자 안내 후 플랫폼에서 처리됩니다."

Q3. "Data Disk에는 어떤 정보가 포함되나요?"
A3. "채권별 잔액(OPB), 연체 기간, 차주 업종 분류, 담보물 현황,
     법적 진행 상태(경매, 소송 등) 등이 포함됩니다.
     개인정보는 PIPA 기준에 따라 비식별화 처리됩니다."

Q4. "입찰가격은 어떤 형태로 제출하나요?"
A4. "OPB 대비 매각가율(%) 형태로 제출합니다.
     예: OPB 100억원 Pool에 20% 입찰 시 20억원 제시.
     입찰 양식은 Bid Package에 포함되어 있습니다."

Q5. "낙찰되지 않은 경우 제출한 정보는 어떻게 처리되나요?"
A5. "미낙찰 시 제출된 입찰서류는 즉시 파기됩니다.
     NDA에 따라 수령한 Data Disk 정보는 외부 유출이 금지되며,
     위반 시 NDA 약정에 따른 책임이 발생합니다."
```

---

### ⑦ CTA

섹션 배경: `bg-[#2D2D2D]`

```
h2:    "인수 상담 신청"  (text-white)
설명:  "투자 관심 자산 유형과 희망 규모를 간략히 알려주시면
        삼일PwC 담당자가 영업일 2일 이내 연락드립니다."
       (text-body-lg text-white opacity-80 mt-4 mb-8)
버튼:  <ConsultingButton type="buying" />
버튼 아래:
  <p className="mt-5 text-caption text-white opacity-50">
    상담은 무료이며, 적격 투자자 여부가 불확실한 경우에도 신청 가능합니다.
  </p>
```

**B1과의 차이:**
- "상담은 무료"는 동일하지만 뒤에 "적격 여부 불확실해도 신청 가능" 추가
- 투자자들이 "나는 자격이 되나?" 때문에 망설이는 것을 사전에 해소

---

## 신규/수정 컴포넌트 목록

```
신규 없음 — selling 페이지 구현 완료 후 아래 컴포넌트 재사용:
  components/ui/Accordion.tsx          (이미 생성됨)
  components/service/StrengthCard.tsx  (이미 생성됨)
  components/service/AssetTypeCard.tsx (badges prop 이미 추가됨)
  components/ui/ProcessSteps.tsx       (5단계 지원 이미 수정됨)

신규:
  components/service/EligibilityCard.tsx  — 적격 투자자 기준 카드
```

EligibilityCard 스펙:
```typescript
interface EligibilityCardProps {
  icon: LucideIcon
  title: string
  items: string[]   // 불릿 항목
  note: string      // 하단 안내 문구
}

// 스타일
border border-[#DEDEDE] rounded p-6
상단: border-t-4 border-[#D04A02]
아이콘: color #D04A02, size 32, mb-3
제목: text-h3 font-heading gray-800 mt-3
항목 ul: space-y-2 mt-4
  li: text-body-sm gray-700 before:content-['•'] before:text-[#D04A02] before:mr-2
하단 note: text-caption gray-500 mt-4 pt-4 border-t border-[#EDEDEDE]
```

---

## Claude Code 실행 프롬프트

```
아래 파일들을 읽어:
  .claude/agents/design.md
  .claude/skills/design-system.md
  .claude/skills/selling-page-content.md   ← selling 페이지와 공통 컴포넌트 확인용

읽은 후 app/(public)/service/buying/page.tsx 를
아래 7개 섹션 구조로 전면 재작성해줘.

selling 페이지에서 이미 만든 컴포넌트
(Accordion, StrengthCard, AssetTypeCard, ProcessSteps)는 그대로 재사용해.
EligibilityCard만 신규 작성이 필요해.

─── 섹션 구조 ────────────────────────────────────────────

① <PageHeader
     overline="서비스 소개 · 인수 자문"
     title="NPL 인수 자문"
     subtitle="삼일PwC의 검증된 딜 소싱 채널을 통해 국내 주요 NPL 매각 기회에 가장 먼저 접근하세요."
   />

② <Section bg="white">
   제목: "투자 대상 자산 유형"
   부제목: "삼일PwC가 자문하는 NPL Pool은 엄격한 데이터 검증을 거칩니다."
           (text-body text-[#7D7D7D] mt-3 mb-10)
   AssetTypeCard × 3:
     {
       icon: Users,
       type: "무담보 NPL",
       desc: "개인 신용·카드·할부 부실채권으로 구성된 Pool입니다.\n회수율 데이터가 풍부하고 포트폴리오 다각화에 적합합니다. CCRS·IRL 등 정상화 채권도 포함됩니다.",
       badges: ["CCRS", "IRL", "일반 무담보"]
     }
     {
       icon: Building,
       type: "담보 NPL",
       desc: "부동산 담보가 설정된 부실채권으로 상대적으로 회수 가능성이 높습니다.\n담보물 감정평가서와 법적 상태가 Data Disk에 포함되어 투자 판단에 필요한 정보를 충분히 제공합니다.",
       badges: ["아파트 담보", "상업용 부동산", "Special Asset"]
     }
     {
       icon: Landmark,
       type: "PF 채권",
       desc: "프로젝트 파이낸싱 관련 부실채권으로 사업장 현황·분양률·시행사 재무 상태 등 상세 자료가 제공됩니다.\n고수익을 추구하는 기관투자자에게 적합합니다.",
       badges: ["주거용 PF", "상업용 PF", "브릿지론"]
     }
   하단 노트 (border-l-4 border-[#FFB600] bg-[#FFFBF0] pl-4 py-3 mt-8):
     "삼일PwC NPL 플랫폼에 등록되는 모든 Pool은 담당자의 데이터 검증을 거친 후 공개됩니다.
      Data Disk 품질과 법적 리스크 검토가 사전에 완료된 딜만 진행됩니다."

③ <Section bg="dark">
   제목: "삼일PwC를 통해 인수하는 이유"  (text-white)
   부제목: "단순 플랫폼이 아닙니다. 검증된 딜에 가장 먼저 접근하는 채널입니다."  (text-white opacity-70)
   grid grid-cols-1 md:grid-cols-2 gap-6 mt-12:
   StrengthCard × 4:
     { icon: Zap,         title: "선제적 딜 접근",          desc: "삼일PwC는 국내 주요 금융기관과의 직접 자문 관계를 통해 시장 공개 전 단계부터 딜 정보를 확보합니다. 적격 투자자로 등록되면 Invitation Letter를 우선 수령합니다." }
     { icon: FileSearch,  title: "검증된 Data Disk 품질",   desc: "삼일PwC 담당자가 직접 검토한 Data Disk를 제공합니다. 채권 데이터의 정확성, 담보물 현황, 법적 상태가 사전 검증되어 투자자의 실사 부담을 줄입니다." }
     { icon: Users,       title: "공정한 입찰 프로세스",    desc: "온라인 플랫폼을 통해 입찰 정보와 일정을 투명하게 공개합니다. 모든 적격 투자자에게 동일한 정보를 동시에 제공하여 공정한 경쟁 환경을 보장합니다." }
     { icon: Headphones,  title: "입찰 전 과정 지원",       desc: "NDA·LOI 절차부터 Bid Package 검토, 입찰서류 제출까지 삼일PwC 담당자가 단계별로 안내합니다. NPL 투자 경험이 적은 기관도 참여 가능합니다." }

④ <Section bg="gray">
   제목: "입찰 참여 프로세스"
   부제목: "상담 신청부터 거래 종결까지 체계적으로 안내합니다."
           (text-body text-[#7D7D7D] mt-3 mb-12)
   ProcessSteps 5단계:
     01 인수 상담 신청       — "투자 관심 자산 유형, 희망 규모, 투자 기준을 공유합니다.\n영업일 2일 이내 담당자가 연락드립니다."
     02 적격 투자자 확인     — "투자자 자격 검토 후 NDA를 체결합니다.\nInvitation Letter(IL) 수령 후 입찰 참여 자격이 부여됩니다."
     03 Bid Package 수령     — "Data Disk, LSPA 초안, 입찰 지침서가 포함된 Bid Package를 플랫폼에서 다운로드합니다."
     04 입찰서류 제출        — "LOI와 입찰가격을 플랫폼에서 온라인으로 제출합니다.\n입찰기일 내 제출하면 자동으로 접수 확인이 발송됩니다."
     05 우선협상·거래 종결   — "낙찰 시 LSPA 조건을 협의하고 Interim 정산 완료 후 채권이 양수됩니다."

⑤ <Section bg="white">
   제목: "적격 투자자 기준"
   부제목: "아래 기준을 충족하는 기관이라면 상담 신청 후 적격 여부를 확인받을 수 있습니다."
           (text-body text-[#7D7D7D] mt-3 mb-10)

   EligibilityCard 컴포넌트 신규 작성 (components/service/EligibilityCard.tsx):
     Props: icon(LucideIcon), title(string), items(string[]), note(string)
     스타일: border border-[#DEDEDE] rounded p-6, 상단 border-t-4 border-[#D04A02]
     항목 li: text-body-sm gray-700, 앞에 오렌지 • 불릿
     하단 note: text-caption gray-500, border-t border-[#DEDEDE] pt-4 mt-4

   EligibilityCard × 3:
     {
       icon: Building2,
       title: "기관 투자자",
       items: ["자산운용사, F&I(자산관리회사)", "저축은행, 캐피탈, 보험사", "기타 금융기관 및 적격 법인"],
       note: "개인 투자자는 참여가 불가합니다."
     }
     {
       icon: Award,
       title: "투자 역량",
       items: ["NPL 또는 부실자산 투자 경험 보유", "자체 실사 및 가치평가 능력", "내부 투자심의 절차 및 리스크 관리 체계"],
       note: "경험이 부족한 경우 삼일PwC 자문 지원이 가능합니다."
     }
     {
       icon: FileCheck,
       title: "서류 요건",
       items: ["NDA(비밀유지서약서) 체결 가능한 법인", "LOI(입찰참가의향서) 제출 가능", "입찰 참여 시 필요한 법인 서류 제출"],
       note: "서류 양식은 적격 투자자 확인 후 안내드립니다."
     }

   하단 강조 박스 (bg-[#FFF5EE] border border-[#D04A02] rounded p-5 mt-10 max-w-2xl mx-auto text-center):
     "기준 충족 여부가 불확실한 경우에도 상담 신청 후 확인이 가능합니다."
     (text-body-sm text-[#D04A02] font-medium)
     "삼일PwC 담당자가 검토 후 안내드립니다."
     (text-body-sm gray-700 mt-1)

⑥ <Section bg="gray">
   제목: "자주 묻는 질문"
   Accordion (selling에서 만든 컴포넌트 재사용):
     Q1 "현재 입찰 가능한 딜 목록은 어디서 볼 수 있나요?"
     A1 "회원가입 후 관리자 인증을 받으면 '거래현황' 메뉴에서 현재 진행 중인 Pool 목록을 확인할 수 있습니다.\nPool별 자산 유형, 규모, 입찰기일 등 기본 정보가 제공됩니다."

     Q2 "입찰 참여 시 NDA 체결은 어떻게 진행되나요?"
     A2 "인수 상담 신청 후 담당자 배정 시 NDA 양식을 안내드립니다.\n체결 완료 후 Invitation Letter가 발송되며 플랫폼 내 Data Disk 접근 권한이 부여됩니다."

     Q3 "Data Disk에는 어떤 정보가 포함되나요?"
     A3 "채권별 잔액(OPB), 연체 기간, 차주 업종 분류, 담보물 현황, 법적 진행 상태(경매·소송 등)가 포함됩니다.\n개인정보는 PIPA 기준에 따라 비식별화 처리됩니다."

     Q4 "입찰가격은 어떤 형태로 제출하나요?"
     A4 "OPB 대비 매각가율(%) 형태로 제출합니다.\n예: OPB 100억원 Pool에 20% 입찰 시 20억원 제시. 입찰 양식은 Bid Package에 포함됩니다."

     Q5 "낙찰되지 않은 경우 제출한 정보는 어떻게 처리되나요?"
     A5 "미낙찰 시 제출된 입찰서류는 즉시 파기됩니다.\nNDA에 따라 수령한 Data Disk 정보는 외부 유출이 금지되며, 위반 시 NDA 약정에 따른 책임이 발생합니다."

⑦ <Section bg="dark">
   text-center
   h2: "인수 상담 신청"  (text-white)
   설명: "투자 관심 자산 유형과 희망 규모를 간략히 알려주시면 삼일PwC 담당자가 영업일 2일 이내 연락드립니다."
         (text-body-lg text-white opacity-80 mt-4 mb-8)
   <ConsultingButton type="buying" />
   <p className="mt-5 text-caption text-white opacity-50">
     상담은 무료이며, 적격 투자자 여부가 불확실한 경우에도 신청 가능합니다.
   </p>

─── 완료 후 확인 ─────────────────────────────────────────

1. 페이지가 7개 섹션으로 구성되는지 스크롤해서 확인
2. 섹션 배경 교차: white → dark → gray → white → gray → dark 순서 확인
   (selling 페이지와 동일한 교차 패턴)
3. EligibilityCard 3개가 균등한 3열 그리드로 표시되는지 확인
4. EligibilityCard 상단 border-t-4 border-[#D04A02] 라인 표시 확인
5. 하단 강조 박스(오렌지 border)가 중앙 정렬로 표시되는지 확인
6. FAQ 아코디언이 selling 페이지와 동일하게 동작하는지 확인
7. 모바일(375px)에서 EligibilityCard 1열 전환 확인
8. /service/selling 과 /service/buying 을 나란히 열어
   섹션 수(7개), 배경 교차, 컴포넌트 스타일이 일관된지 비교 확인
```
