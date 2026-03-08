# Instruction: 매각 자문 페이지 (B1) 콘텐츠 보강

## 배경

현재 `/service/selling` 페이지는 4개 섹션으로 구성되어 있으나
실질적인 콘텐츠가 부족하다.

```
현재: PageHeader → 자산유형 3카드 → 프로세스 4단계 → CTA
문제: 금융기관 담당자가 "왜 삼일PwC에 맡겨야 하는가"에 대한 답이 없음
```

**타겟 방문자:** 은행·저축은행·캐피탈·대부업 등 금융기관의 여신관리·자산매각 담당자.
이들은 이미 NPL 매각이 무엇인지 알고 있다.
그들에게 필요한 것은 **왜 삼일PwC인가**, **어떤 과정으로 진행되는가**,
그리고 **지금 상담을 신청할 이유**이다.

## 개선된 페이지 구조 (7섹션)

```
① PageHeader       — 포지셔닝 강화
② 자문 대상 자산   — 기존 3카드 + 설명 보강
③ 삼일PwC 강점     — Why PwC (신규)
④ 매각 프로세스    — 기존 4단계 → 5단계로 확장 + 각 단계 상세 설명
⑤ 자주 묻는 질문   — FAQ (신규)
⑥ 유의사항         — 신뢰 구축용 안내 (신규)
⑦ CTA              — 상담 신청
```

---

## 섹션별 상세 콘텐츠

### ① PageHeader

```
overline:  "서비스 소개 · 매각 자문"
title:     "NPL 매각 자문"
subtitle:  "은행·저축은행·캐피탈 등 금융기관의 부실채권 매각을
            삼일PwC 전문가가 처음부터 끝까지 함께합니다."
```

---

### ② 자문 대상 자산 (기존 3카드 확장)

섹션 제목: `"취급 자산 유형"`
섹션 부제목: `"무담보부터 PF까지, 모든 유형의 NPL 매각을 지원합니다."`

카드 3개 — 기존보다 설명을 구체화:

```
[카드 1] 무담보 NPL
  아이콘: Users (lucide-react)
  제목: "무담보 NPL"
  설명: "개인 신용대출·카드론·할부금융 등 담보 없는 부실채권입니다.
         CCRS(신용회복), IRL(정상화 채권), 일반 무담보 등
         유형에 따른 맞춤 매각 전략을 수립합니다."
  배지: ["CCRS", "IRL", "일반 무담보"]

[카드 2] 담보 NPL
  아이콘: Building (lucide-react)
  제목: "담보 NPL"
  설명: "부동산·동산 등 담보가 설정된 부실채권입니다.
         담보물 현황 파악과 법적 리스크 검토를 통해
         최적의 매각가율을 산정합니다."
  배지: ["아파트 담보", "상업용 부동산", "Special Asset"]

[카드 3] PF 채권
  아이콘: Landmark (lucide-react)
  제목: "PF 채권"
  설명: "프로젝트 파이낸싱 관련 부실채권입니다.
         사업장 현황, 시행사 재무 상태, 분양률 등
         복합적인 요소를 종합 분석하여 매각을 진행합니다."
  배지: ["주거용 PF", "상업용 PF", "브릿지론"]
```

하단 노트 (border-l-4 border-[#FFB600]):
```
"NPL성 실물자산(부동산 경공매 물건 등)도 접수 가능합니다.
 상담 신청 시 자산 유형과 함께 문의해 주세요."
```

---

### ③ 왜 삼일PwC인가 (신규 섹션)

섹션 배경: `bg-[#2D2D2D]` (다크)
섹션 제목: `"왜 삼일PwC에 맡기는가"` (text-white)
섹션 부제목: `"국내 NPL 시장에서 가장 많은 거래를 자문해온 경험이 있습니다."` (text-white opacity-70)

강점 4개 — 2×2 그리드 (모바일: 1열):

```
[강점 1]
  아이콘: Network (lucide-react, color: #D04A02)
  제목: "광범위한 매수인 네트워크"
  설명: "국내 주요 F&I·자산운용사·기관투자자와의 기존 관계를 통해
         적격 매수인을 빠르게 모집합니다.
         제한적 입찰 또는 공개 입찰 방식 모두 운영 가능합니다."

[강점 2]
  아이콘: Scale (lucide-react, color: #D04A02)
  제목: "전문적인 자산 평가"
  설명: "PwC 글로벌 방법론을 기반으로 MRP(최소 회수 가격)를 산정하고
         Data Disk를 작성합니다.
         담보·무담보·PF 각 유형별 전담 전문가가 배치됩니다."

[강점 3]
  아이콘: ShieldCheck (lucide-react, color: #D04A02)
  제목: "법적·컴플라이언스 리스크 관리"
  설명: "금융감독원 보고, PIPA(개인정보보호법) 준수,
         LSPA 계약 검토까지 법적 리스크를 선제적으로 관리합니다.
         삼일PwC 법무팀과의 협업 체계가 구축되어 있습니다."

[강점 4]
  아이콘: BarChart3 (lucide-react, color: #D04A02)
  제목: "데이터 기반 매각 전략"
  설명: "과거 유사 거래의 낙찰가율 데이터와 시장 분석을 바탕으로
         최적의 매각 타이밍과 가격을 제안합니다.
         디지털 플랫폼을 통해 진행 현황을 실시간으로 공유합니다."
```

---

### ④ 매각 프로세스 (기존 4단계 → 5단계로 확장)

섹션 배경: `bg-[#F5F5F5]`
섹션 제목: `"매각 진행 프로세스"`
섹션 부제목: `"상담 신청부터 거래 종결까지 평균 3~6개월 소요됩니다."`

ProcessSteps 5단계:

```typescript
steps={[
  {
    step: "01",
    title: "매각 상담 신청",
    desc: "자산 현황, 규모, 매각 희망 시기를 공유합니다.\n삼일PwC 담당자가 영업일 2일 이내 연락드립니다."
  },
  {
    step: "02",
    title: "자산 실사 및 MRP 산정",
    desc: "채권 데이터를 검토하고 Data Disk를 작성합니다.\n담보 현황, 연체 기간, 법적 상태를 종합해 최소회수가격(MRP)을 산정합니다."
  },
  {
    step: "03",
    title: "투자자 모집 및 입찰",
    desc: "Invitation Letter(IL) 발송 후 적격 투자자를 대상으로 입찰을 진행합니다.\nNDA·LOI 절차를 통해 기밀 유지를 보장합니다."
  },
  {
    step: "04",
    title: "우선협상 및 계약",
    desc: "낙찰자와 LSPA(자산양수도계약서) 조건을 협의합니다.\n계약 조건 검토 및 법적 리스크 관리를 지원합니다."
  },
  {
    step: "05",
    title: "거래 종결",
    desc: "자산 확정일 기준 Interim 정산을 완료하고 채권 양수도를 마무리합니다.\n거래 종결 후 감독당국 보고 절차도 지원합니다."
  },
]}
```

**ProcessSteps 컴포넌트 수정 사항:**
- 기존 4열 고정(`grid-cols-4`) → 5열 지원하도록 수정
  ```typescript
  // ProcessSteps.tsx — cols prop 추가
  // grid-cols-1 md:grid-cols-{steps.length} 으로 동적 처리
  // 또는 단순히 md:grid-cols-5 조건부 클래스
  ```
- desc 텍스트에서 `\n` → `<br />` 또는 `whitespace-pre-line` 적용

---

### ⑤ 자주 묻는 질문 FAQ (신규)

섹션 배경: `bg-white`
섹션 제목: `"자주 묻는 질문"`

아코디언 5개:

```
Q1. 매각 가능한 채권의 최소 규모가 있나요?
A.  별도의 최소 규모 기준은 없습니다. 다만 Pool 구성의 효율성을 위해
    복수의 채권을 묶어 매각하는 것을 권장합니다.
    소규모 채권도 유사 유형의 채권과 합산하여 매각하는 방식으로 지원 가능합니다.

Q2. 매각 진행 시 개인정보 보호는 어떻게 처리되나요?
A.  Data Disk에 포함되는 차주 정보는 PIPA(개인정보보호법) 기준에 따라
    비식별화(가명 처리) 후 제공됩니다. NDA 체결 투자자에게만 접근 권한이 부여됩니다.

Q3. 매각 기간은 어느 정도 걸리나요?
A.  자산 규모와 유형에 따라 다르지만 통상 3~6개월 소요됩니다.
    실사 준비가 완료된 경우 더 빠른 진행도 가능합니다.

Q4. 매각가율은 어떻게 결정되나요?
A.  삼일PwC는 OPB(원금잔액) 대비 양수도가격의 비율인 매각가율을
    유사 거래 사례, 담보물 감정, 연체 기간 등을 종합해 MRP로 제시합니다.
    최종 가율은 입찰 경쟁을 통해 시장에서 결정됩니다.

Q5. 자문 수수료는 어떻게 되나요?
A.  수수료 구조는 거래 규모와 복잡성에 따라 협의하여 결정합니다.
    상담 신청 후 미팅 시 구체적인 조건을 안내드립니다.
```

**아코디언 컴포넌트 스펙:**
```typescript
// components/ui/Accordion.tsx (신규)
// 클릭 시 답변 펼침/접기
// 열린 항목: border-l-4 border-[#D04A02]
// 질문: text-body font-semibold gray-800
// 답변: text-body-sm gray-700, whitespace-pre-line
// border-b border-[#DEDEDE] 구분
// 닫힌 상태 아이콘: ChevronDown | 열린 상태: ChevronUp (lucide-react)
```

---

### ⑥ 유의사항 (신규)

섹션 배경: `bg-[#F5F5F5]`
섹션 제목: `"서비스 이용 안내"`

컴팩트 박스 형태 (max-w-3xl mx-auto, border border-[#DEDEDE] rounded bg-white p-8):

```
항목 4개 (체크 아이콘 대신 • 불릿, text-body-sm gray-700):

• 본 플랫폼을 통한 매각 자문 서비스는 금융기관 및 적격 법인을 대상으로 합니다.
  개인 차주의 채권 매각 상담은 취급하지 않습니다.

• 상담 신청 후 담당자 배정까지 영업일 기준 2일 이내 연락드립니다.
  긴급 건은 상담 내용에 "긴급"을 명시해 주세요.

• Data Disk 제출 등 실사 과정에서 개인정보가 포함된 경우,
  별도의 개인정보처리 동의 및 비식별화 절차가 적용됩니다.

• 본 페이지에 기재된 프로세스 및 기간은 일반적인 기준이며,
  거래 특성에 따라 변경될 수 있습니다.
```

---

### ⑦ CTA (기존 강화)

섹션 배경: `bg-[#2D2D2D]`

```
h2:    "매각 자문 상담 신청"
설명:  "자산 현황을 간략히 알려주시면 삼일PwC 담당자가
        영업일 2일 이내 연락드립니다."
버튼:  <ConsultingButton type="selling" />  (기존 그대로)
버튼 하단:
  "상담은 무료이며, 구체적인 자문 계약은 미팅 후 진행됩니다."
  (text-caption text-white opacity-50, mt-4)
```

---

## 신규 컴포넌트 목록

```
components/ui/Accordion.tsx          — FAQ 아코디언 (신규)
components/service/StrengthCard.tsx  — Why PwC 강점 카드 (신규, 다크 배경용)
```

기존 컴포넌트 수정:
```
components/ui/ProcessSteps.tsx   — 5단계 지원 (grid-cols 동적화)
components/service/AssetTypeCard.tsx — badges?: string[] prop 추가
```

---

## Claude Code 실행 프롬프트

```
아래 파일들을 읽어:
  .claude/agents/design.md
  .claude/skills/design-system.md
  .claude/skills/homepage-content.md

읽은 후 app/(public)/service/selling/page.tsx 를
아래 7개 섹션 구조로 전면 재작성해줘.
기존 4섹션을 대체한다.

─── 섹션 구조 ────────────────────────────────────────────

① <PageHeader
     overline="서비스 소개 · 매각 자문"
     title="NPL 매각 자문"
     subtitle="은행·저축은행·캐피탈 등 금융기관의 부실채권 매각을 삼일PwC 전문가가 처음부터 끝까지 함께합니다."
   />

② <Section bg="white">
   제목: "취급 자산 유형"
   부제목: "무담보부터 PF까지, 모든 유형의 NPL 매각을 지원합니다."
           (text-body text-[#7D7D7D] mt-3 mb-10)
   AssetTypeCard × 3 (badges prop 추가):
     {
       icon: Users,
       type: "무담보 NPL",
       desc: "개인 신용대출·카드론·할부금융 등 담보 없는 부실채권입니다.\nCCRS(신용회복), IRL(정상화 채권), 일반 무담보 등 유형에 따른 맞춤 매각 전략을 수립합니다.",
       badges: ["CCRS", "IRL", "일반 무담보"]
     }
     {
       icon: Building,
       type: "담보 NPL",
       desc: "부동산·동산 등 담보가 설정된 부실채권입니다.\n담보물 현황 파악과 법적 리스크 검토를 통해 최적의 매각가율을 산정합니다.",
       badges: ["아파트 담보", "상업용 부동산", "Special Asset"]
     }
     {
       icon: Landmark,
       type: "PF 채권",
       desc: "프로젝트 파이낸싱 관련 부실채권입니다.\n사업장 현황, 시행사 재무 상태, 분양률 등 복합 요소를 종합 분석하여 매각을 진행합니다.",
       badges: ["주거용 PF", "상업용 PF", "브릿지론"]
     }
   하단 노트 (border-l-4 border-[#FFB600] pl-4 mt-8):
     "NPL성 실물자산(부동산 경공매 물건 등)도 접수 가능합니다. 상담 신청 시 자산 유형과 함께 문의해 주세요."

③ <Section bg="dark">
   제목: "왜 삼일PwC에 맡기는가"  (text-white)
   부제목: "국내 NPL 시장에서 가장 많은 거래를 자문해온 경험이 있습니다."  (text-white opacity-70)
   grid grid-cols-1 md:grid-cols-2 gap-6 mt-12:
     [강점 카드 4개 — StrengthCard 컴포넌트 신규 작성]
     각 카드: bg-white/10 border border-white/20 rounded p-6 text-white
     {
       icon: Network,   (color: #D04A02, size:32)
       title: "광범위한 매수인 네트워크",
       desc: "국내 주요 F&I·자산운용사·기관투자자와의 기존 관계를 통해 적격 매수인을 빠르게 모집합니다. 제한적 입찰 또는 공개 입찰 방식 모두 운영 가능합니다."
     }
     {
       icon: Scale,   (color: #D04A02, size:32)
       title: "전문적인 자산 평가",
       desc: "PwC 글로벌 방법론으로 MRP를 산정하고 Data Disk를 작성합니다. 담보·무담보·PF 각 유형별 전담 전문가가 배치됩니다."
     }
     {
       icon: ShieldCheck,   (color: #D04A02, size:32)
       title: "법적·컴플라이언스 리스크 관리",
       desc: "금융감독원 보고, PIPA 준수, LSPA 계약 검토까지 법적 리스크를 선제적으로 관리합니다."
     }
     {
       icon: BarChart3,   (color: #D04A02, size:32)
       title: "데이터 기반 매각 전략",
       desc: "과거 유사 거래의 낙찰가율 데이터와 시장 분석을 바탕으로 최적의 매각 타이밍과 가격을 제안합니다."
     }

④ <Section bg="gray">
   제목: "매각 진행 프로세스"
   부제목: "상담 신청부터 거래 종결까지 평균 3~6개월 소요됩니다."
           (text-body text-[#7D7D7D] mt-3 mb-12)
   ProcessSteps 5단계 (steps.length 기반으로 grid-cols 동적 처리):
     01 매각 상담 신청   — "자산 현황, 규모, 매각 희망 시기를 공유합니다. 영업일 2일 이내 연락드립니다."
     02 자산 실사·MRP 산정 — "채권 데이터 검토 및 Data Disk 작성, 최소회수가격(MRP) 산정."
     03 투자자 모집·입찰  — "IL 발송, 적격 투자자 NDA·LOI 절차, 입찰 진행."
     04 우선협상·계약     — "LSPA 조건 협의 및 법적 리스크 관리."
     05 거래 종결         — "Interim 정산, 채권 양수도 완료, 감독당국 보고 지원."
   각 단계 desc에서 \n 또는 줄바꿈은 <br /> 처리

⑤ <Section bg="white">
   제목: "자주 묻는 질문"
   Accordion 컴포넌트 신규 작성 (components/ui/Accordion.tsx):
     - items: { question: string, answer: string }[]
     - 클릭으로 펼침/접기, 한 번에 하나만 열림
     - 열린 항목: border-l-4 border-[#D04A02] bg-[#FFF5EE]
     - 질문: text-body font-semibold gray-800
     - 답변: text-body-sm gray-700 whitespace-pre-line
     - 아이콘: ChevronDown / ChevronUp (lucide-react)

   FAQ 5개:
     Q1. "매각 가능한 채권의 최소 규모가 있나요?"
     A1. "별도의 최소 규모 기준은 없습니다. 다만 복수의 채권을 묶어 Pool로 구성해 매각하는 것을 권장합니다.\n소규모 채권도 유사 유형과 합산하는 방식으로 지원 가능합니다."

     Q2. "매각 시 개인정보 보호는 어떻게 처리되나요?"
     A2. "Data Disk에 포함되는 차주 정보는 PIPA 기준에 따라 비식별화(가명 처리) 후 제공됩니다.\nNDA 체결 투자자에게만 접근 권한이 부여됩니다."

     Q3. "매각 기간은 어느 정도 걸리나요?"
     A3. "자산 규모와 유형에 따라 다르지만 통상 3~6개월 소요됩니다.\n실사 준비가 완료된 경우 더 빠른 진행도 가능합니다."

     Q4. "매각가율은 어떻게 결정되나요?"
     A4. "삼일PwC는 OPB 대비 양수도가격의 비율인 매각가율을 유사 거래 사례, 담보물 감정, 연체 기간 등을 종합해 MRP로 제시합니다.\n최종 가율은 입찰 경쟁을 통해 시장에서 결정됩니다."

     Q5. "자문 수수료는 어떻게 되나요?"
     A5. "수수료 구조는 거래 규모와 복잡성에 따라 협의하여 결정합니다.\n상담 신청 후 미팅 시 구체적인 조건을 안내드립니다."

⑥ <Section bg="gray">
   제목: "서비스 이용 안내"
   max-w-3xl mx-auto border border-[#DEDEDE] rounded bg-white p-8:
   ul space-y-4 (• 불릿, text-body-sm gray-700):
     • "본 플랫폼을 통한 매각 자문 서비스는 금융기관 및 적격 법인을 대상으로 합니다. 개인 차주의 채권 매각 상담은 취급하지 않습니다."
     • "상담 신청 후 담당자 배정까지 영업일 기준 2일 이내 연락드립니다. 긴급 건은 상담 내용에 '긴급'을 명시해 주세요."
     • "Data Disk 제출 등 실사 과정에서 개인정보가 포함된 경우, 별도의 개인정보처리 동의 및 비식별화 절차가 적용됩니다."
     • "본 페이지에 기재된 프로세스 및 기간은 일반적인 기준이며, 거래 특성에 따라 변경될 수 있습니다."

⑦ <Section bg="dark">
   text-center
   h2: "매각 자문 상담 신청"  (text-white)
   설명: "자산 현황을 간략히 알려주시면 삼일PwC 담당자가 영업일 2일 이내 연락드립니다."
         (text-body-lg text-white opacity-80 mt-4 mb-8)
   <ConsultingButton type="selling" />
   버튼 아래:
     <p className="mt-5 text-caption text-white opacity-50">
       상담은 무료이며, 구체적인 자문 계약은 미팅 후 진행됩니다.
     </p>

─── 신규 컴포넌트 작성 ───────────────────────────────────

1. components/ui/Accordion.tsx
   interface AccordionItem { question: string; answer: string }
   interface AccordionProps { items: AccordionItem[] }
   - useState로 openIndex(number|null) 관리
   - 한 번에 하나만 열림
   - 열린 항목: bg-[#FFF5EE] border-l-4 border-[#D04A02]
   - transition: max-height 200ms ease

2. components/service/StrengthCard.tsx
   interface StrengthCardProps {
     icon: LucideIcon; title: string; desc: string
   }
   - 다크 배경 위에 올라가는 카드
   - bg: rgba(255,255,255,0.08)  border: rgba(255,255,255,0.15)
   - rounded p-6
   - 아이콘: color #D04A02, size 32, mb-4
   - 제목: text-h3 font-heading text-white mt-3
   - 설명: text-body-sm text-white opacity-75 mt-2

3. components/service/AssetTypeCard.tsx 수정
   badges?: string[] prop 추가
   카드 하단에 배지 렌더링:
   <div className="flex flex-wrap gap-2 mt-4">
     {badges?.map(b => (
       <span key={b} className="px-2 py-0.5 text-xs border border-[#DEDEDE] rounded text-[#7D7D7D]">{b}</span>
     ))}
   </div>

4. components/ui/ProcessSteps.tsx 수정
   steps.length에 따라 grid-cols 동적 지정:
   className={`grid grid-cols-1 gap-8 ${
     steps.length === 4 ? 'md:grid-cols-4' :
     steps.length === 5 ? 'md:grid-cols-5' : 'md:grid-cols-3'
   }`}
   desc 내 \n → <br /> 처리 (dangerouslySetInnerHTML 대신 split('\n').map 사용)

─── 완료 후 확인 ─────────────────────────────────────────

1. 페이지가 7개 섹션으로 구성되는지 스크롤해서 확인
2. 섹션 배경 교차: white → dark → gray → white → gray → dark 순서 확인
3. AssetTypeCard 배지가 카드 하단에 표시되는지 확인
4. StrengthCard가 다크 배경에서 가독성 있게 표시되는지 확인
5. ProcessSteps 5단계가 데스크톱에서 1행으로 표시되는지 확인
   (너무 좁으면 md:grid-cols-3 + lg:grid-cols-5 조합으로 조정)
6. FAQ 아코디언 클릭 시 하나씩 열리고 닫히는지 확인
7. 유의사항 박스가 중앙 정렬로 표시되는지 확인
8. 모바일(375px)에서 전체 섹션 레이아웃 확인
   특히 StrengthCard 2×2 → 1열 전환 확인
```
