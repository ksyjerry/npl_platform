"use client";

import { Users, Building, Landmark, Zap, FileSearch, Headphones, Building2, Award, FileCheck } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
import Section from "@/components/layout/Section";
import AssetTypeCard from "@/components/service/AssetTypeCard";
import StrengthCard from "@/components/service/StrengthCard";
import ProcessSteps from "@/components/ui/ProcessSteps";
import Accordion from "@/components/ui/Accordion";
import EligibilityCard from "@/components/service/EligibilityCard";
import ConsultCTA from "@/components/consulting/ConsultCTA";

const ASSET_TYPES = [
  {
    icon: <Users size={32} />,
    type: "무담보 NPL",
    desc: "개인 신용·카드·할부 부실채권으로 구성된 Pool입니다.\n회수율 데이터가 풍부하고 포트폴리오 다각화에 적합합니다. CCRS·IRL 등 정상화 채권도 포함됩니다.",
    badges: ["CCRS", "IRL", "일반 무담보"],
  },
  {
    icon: <Building size={32} />,
    type: "담보 NPL",
    desc: "부동산 담보가 설정된 부실채권으로 상대적으로 회수 가능성이 높습니다.\n담보물 감정평가서와 법적 상태가 Data Disk에 포함되어 투자 판단에 필요한 정보를 충분히 제공합니다.",
    badges: ["아파트 담보", "상업용 부동산", "Special Asset"],
  },
  {
    icon: <Landmark size={32} />,
    type: "PF 채권",
    desc: "프로젝트 파이낸싱 관련 부실채권으로 사업장 현황·분양률·시행사 재무 상태 등 상세 자료가 제공됩니다.\n고수익을 추구하는 기관투자자에게 적합합니다.",
    badges: ["주거용 PF", "상업용 PF", "브릿지론"],
  },
];

const STRENGTHS = [
  {
    icon: Zap,
    title: "선제적 딜 접근",
    desc: "삼일PwC는 국내 주요 금융기관과의 직접 자문 관계를 통해 시장 공개 전 단계부터 딜 정보를 확보합니다. 적격 투자자로 등록되면 Invitation Letter를 우선 수령합니다.",
  },
  {
    icon: FileSearch,
    title: "검증된 Data Disk 품질",
    desc: "삼일PwC 담당자가 직접 검토한 Data Disk를 제공합니다. 채권 데이터의 정확성, 담보물 현황, 법적 상태가 사전 검증되어 투자자의 실사 부담을 줄입니다.",
  },
  {
    icon: Users,
    title: "공정한 입찰 프로세스",
    desc: "온라인 플랫폼을 통해 입찰 정보와 일정을 투명하게 공개합니다. 모든 적격 투자자에게 동일한 정보를 동시에 제공하여 공정한 경쟁 환경을 보장합니다.",
  },
  {
    icon: Headphones,
    title: "입찰 전 과정 지원",
    desc: "NDA·LOI 절차부터 Bid Package 검토, 입찰서류 제출까지 삼일PwC 담당자가 단계별로 안내합니다. NPL 투자 경험이 적은 기관도 참여 가능합니다.",
  },
];

const BUYING_STEPS = [
  {
    step: "01",
    title: "인수 상담 신청",
    desc: "투자 관심 자산 유형, 희망 규모, 투자 기준을 공유합니다.\n영업일 2일 이내 담당자가 연락드립니다.",
  },
  {
    step: "02",
    title: "적격 투자자 확인",
    desc: "투자자 자격 검토 후 NDA를 체결합니다.\nInvitation Letter(IL) 수령 후 입찰 참여 자격이 부여됩니다.",
  },
  {
    step: "03",
    title: "Bid Package 수령",
    desc: "Data Disk, LSPA 초안, 입찰 지침서가 포함된 Bid Package를 플랫폼에서 다운로드합니다.",
  },
  {
    step: "04",
    title: "입찰서류 제출",
    desc: "LOI와 입찰가격을 플랫폼에서 온라인으로 제출합니다.\n입찰기일 내 제출하면 자동으로 접수 확인이 발송됩니다.",
  },
  {
    step: "05",
    title: "우선협상·거래 종결",
    desc: "낙찰 시 LSPA 조건을 협의하고 Interim 정산 완료 후 채권이 양수됩니다.",
  },
];

const ELIGIBILITY = [
  {
    icon: Building2,
    title: "기관 투자자",
    items: [
      "자산운용사, F&I(자산관리회사)",
      "저축은행, 캐피탈, 보험사",
      "기타 금융기관 및 적격 법인",
    ],
    note: "개인 투자자는 참여가 불가합니다.",
  },
  {
    icon: Award,
    title: "투자 역량",
    items: [
      "NPL 또는 부실자산 투자 경험 보유",
      "자체 실사 및 가치평가 능력",
      "내부 투자심의 절차 및 리스크 관리 체계",
    ],
    note: "경험이 부족한 경우 삼일PwC 자문 지원이 가능합니다.",
  },
  {
    icon: FileCheck,
    title: "서류 요건",
    items: [
      "NDA(비밀유지서약서) 체결 가능한 법인",
      "LOI(입찰참가의향서) 제출 가능",
      "입찰 참여 시 필요한 법인 서류 제출",
    ],
    note: "서류 양식은 적격 투자자 확인 후 안내드립니다.",
  },
];

const FAQ_ITEMS = [
  {
    question: "현재 입찰 가능한 딜 목록은 어디서 볼 수 있나요?",
    answer:
      "회원가입 후 관리자 인증을 받으면 '거래현황' 메뉴에서 현재 진행 중인 Pool 목록을 확인할 수 있습니다.\nPool별 자산 유형, 규모, 입찰기일 등 기본 정보가 제공됩니다.",
  },
  {
    question: "입찰 참여 시 NDA 체결은 어떻게 진행되나요?",
    answer:
      "인수 상담 신청 후 담당자 배정 시 NDA 양식을 안내드립니다.\n체결 완료 후 Invitation Letter가 발송되며 플랫폼 내 Data Disk 접근 권한이 부여됩니다.",
  },
  {
    question: "Data Disk에는 어떤 정보가 포함되나요?",
    answer:
      "채권별 잔액(OPB), 연체 기간, 차주 업종 분류, 담보물 현황, 법적 진행 상태(경매·소송 등)가 포함됩니다.\n개인정보는 PIPA 기준에 따라 비식별화 처리됩니다.",
  },
  {
    question: "입찰가격은 어떤 형태로 제출하나요?",
    answer:
      "OPB 대비 매각가율(%) 형태로 제출합니다.\n예: OPB 100억원 Pool에 20% 입찰 시 20억원 제시. 입찰 양식은 Bid Package에 포함됩니다.",
  },
  {
    question: "낙찰되지 않은 경우 제출한 정보는 어떻게 처리되나요?",
    answer:
      "미낙찰 시 제출된 입찰서류는 즉시 파기됩니다.\nNDA에 따라 수령한 Data Disk 정보는 외부 유출이 금지되며, 위반 시 NDA 약정에 따른 책임이 발생합니다.",
  },
];

export default function BuyingPage() {
  return (
    <>
      <Navbar />

      {/* ① PageHeader */}
      <PageHeader
        overline="서비스 소개 · 인수 자문"
        title="NPL 인수 자문"
        subtitle="삼일PwC의 검증된 딜 소싱 채널을 통해 국내 주요 NPL 매각 기회에 가장 먼저 접근하세요."
        bgImage="/buying-bg.jpg"
      />

      {/* ② 투자 대상 자산 유형 */}
      <Section bg="white">
        <h2
          className="text-2xl font-semibold"
          style={{ color: "#2D2D2D", lineHeight: 1.3 }}
        >
          투자 대상 자산 유형
        </h2>
        <p className="mt-3 mb-10" style={{ color: "#7D7D7D" }}>
          삼일PwC가 자문하는 NPL Pool은 엄격한 데이터 검증을 거칩니다.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ASSET_TYPES.map((a) => (
            <AssetTypeCard
              key={a.type}
              type={a.type}
              desc={a.desc}
              icon={a.icon}
              badges={a.badges}
            />
          ))}
        </div>
        <div
          className="mt-8 pl-4 py-3 text-sm"
          style={{
            borderLeft: "4px solid #FFB600",
            backgroundColor: "#FFFBF0",
            color: "#7D7D7D",
          }}
        >
          삼일PwC NPL 플랫폼에 등록되는 모든 Pool은 담당자의 데이터 검증을 거친 후 공개됩니다.
          Data Disk 품질과 법적 리스크 검토가 사전에 완료된 딜만 진행됩니다.
        </div>
      </Section>

      {/* ③ 삼일PwC를 통해 인수하는 이유 */}
      <Section bg="dark">
        <h2 className="text-2xl font-semibold text-white" style={{ lineHeight: 1.3 }}>
          삼일PwC를 통해 인수하는 이유
        </h2>
        <p className="mt-3 text-white" style={{ opacity: 0.7 }}>
          단순 플랫폼이 아닙니다. 검증된 딜에 가장 먼저 접근하는 채널입니다.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {STRENGTHS.map((s) => (
            <StrengthCard key={s.title} icon={s.icon} title={s.title} desc={s.desc} />
          ))}
        </div>
      </Section>

      {/* ④ 입찰 참여 프로세스 */}
      <Section bg="gray">
        <h2
          className="text-2xl font-semibold"
          style={{ color: "#2D2D2D", lineHeight: 1.3 }}
        >
          입찰 참여 프로세스
        </h2>
        <p className="mt-3 mb-12" style={{ color: "#7D7D7D" }}>
          상담 신청부터 거래 종결까지 체계적으로 안내합니다.
        </p>
        <ProcessSteps steps={BUYING_STEPS} />
      </Section>

      {/* ⑤ 적격 투자자 기준 */}
      <Section bg="white">
        <h2
          className="text-2xl font-semibold"
          style={{ color: "#2D2D2D", lineHeight: 1.3 }}
        >
          적격 투자자 기준
        </h2>
        <p className="mt-3 mb-10" style={{ color: "#7D7D7D" }}>
          아래 기준을 충족하는 기관이라면 상담 신청 후 적격 여부를 확인받을 수 있습니다.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ELIGIBILITY.map((e) => (
            <EligibilityCard
              key={e.title}
              icon={e.icon}
              title={e.title}
              items={e.items}
              note={e.note}
            />
          ))}
        </div>
        <div
          className="mt-10 max-w-2xl mx-auto text-center border p-5"
          style={{
            backgroundColor: "#FFF5EE",
            borderColor: "#D04A02",
            borderRadius: "4px",
          }}
        >
          <p className="text-sm font-medium" style={{ color: "#D04A02" }}>
            기준 충족 여부가 불확실한 경우에도 상담 신청 후 확인이 가능합니다.
          </p>
          <p className="text-sm mt-1" style={{ color: "#464646" }}>
            삼일PwC 담당자가 검토 후 안내드립니다.
          </p>
        </div>
      </Section>

      {/* ⑥ 자주 묻는 질문 */}
      <Section bg="gray">
        <h2
          className="text-2xl font-semibold mb-8"
          style={{ color: "#2D2D2D", lineHeight: 1.3 }}
        >
          자주 묻는 질문
        </h2>
        <Accordion items={FAQ_ITEMS} />
      </Section>

      {/* ⑦ CTA */}
      <ConsultCTA />

      <Footer />
    </>
  );
}
