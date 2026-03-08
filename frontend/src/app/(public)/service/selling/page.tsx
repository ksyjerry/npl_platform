"use client";

import { Users, Building, Landmark, Network, Scale, ShieldCheck, BarChart3 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
import Section from "@/components/layout/Section";
import AssetTypeCard from "@/components/service/AssetTypeCard";
import StrengthCard from "@/components/service/StrengthCard";
import ProcessSteps from "@/components/ui/ProcessSteps";
import Accordion from "@/components/ui/Accordion";
import ConsultCTA from "@/components/consulting/ConsultCTA";

const ASSET_TYPES = [
  {
    icon: <Users size={32} />,
    type: "무담보 NPL",
    desc: "개인 신용대출·카드론·할부금융 등 담보 없는 부실채권입니다.\nCCRS(신용회복), IRL(정상화 채권), 일반 무담보 등 유형에 따른 맞춤 매각 전략을 수립합니다.",
    badges: ["CCRS", "IRL", "일반 무담보"],
  },
  {
    icon: <Building size={32} />,
    type: "담보 NPL",
    desc: "부동산·동산 등 담보가 설정된 부실채권입니다.\n담보물 현황 파악과 법적 리스크 검토를 통해 최적의 매각가율을 산정합니다.",
    badges: ["아파트 담보", "상업용 부동산", "Special Asset"],
  },
  {
    icon: <Landmark size={32} />,
    type: "PF 채권",
    desc: "프로젝트 파이낸싱 관련 부실채권입니다.\n사업장 현황, 시행사 재무 상태, 분양률 등 복합 요소를 종합 분석하여 매각을 진행합니다.",
    badges: ["주거용 PF", "상업용 PF", "브릿지론"],
  },
];

const STRENGTHS = [
  {
    icon: Network,
    title: "광범위한 매수인 네트워크",
    desc: "국내 주요 F&I·자산운용사·기관투자자와의 기존 관계를 통해 적격 매수인을 빠르게 모집합니다. 제한적 입찰 또는 공개 입찰 방식 모두 운영 가능합니다.",
  },
  {
    icon: Scale,
    title: "전문적인 자산 평가",
    desc: "PwC 글로벌 방법론으로 MRP를 산정하고 Data Disk를 작성합니다. 담보·무담보·PF 각 유형별 전담 전문가가 배치됩니다.",
  },
  {
    icon: ShieldCheck,
    title: "법적·컴플라이언스 리스크 관리",
    desc: "금융감독원 보고, PIPA 준수, LSPA 계약 검토까지 법적 리스크를 선제적으로 관리합니다.",
  },
  {
    icon: BarChart3,
    title: "데이터 기반 매각 전략",
    desc: "과거 유사 거래의 낙찰가율 데이터와 시장 분석을 바탕으로 최적의 매각 타이밍과 가격을 제안합니다.",
  },
];

const SELLING_STEPS = [
  {
    step: "01",
    title: "매각 상담 신청",
    desc: "자산 현황, 규모, 매각 희망 시기를 공유합니다.\n영업일 2일 이내 연락드립니다.",
  },
  {
    step: "02",
    title: "자산 실사·MRP 산정",
    desc: "채권 데이터 검토 및 Data Disk 작성,\n최소회수가격(MRP) 산정.",
  },
  {
    step: "03",
    title: "투자자 모집·입찰",
    desc: "IL 발송, 적격 투자자 NDA·LOI 절차,\n입찰 진행.",
  },
  {
    step: "04",
    title: "우선협상·계약",
    desc: "LSPA 조건 협의 및\n법적 리스크 관리.",
  },
  {
    step: "05",
    title: "거래 종결",
    desc: "Interim 정산, 채권 양수도 완료,\n감독당국 보고 지원.",
  },
];

const FAQ_ITEMS = [
  {
    question: "매각 가능한 채권의 최소 규모가 있나요?",
    answer:
      "별도의 최소 규모 기준은 없습니다. 다만 복수의 채권을 묶어 Pool로 구성해 매각하는 것을 권장합니다.\n소규모 채권도 유사 유형과 합산하는 방식으로 지원 가능합니다.",
  },
  {
    question: "매각 시 개인정보 보호는 어떻게 처리되나요?",
    answer:
      "Data Disk에 포함되는 차주 정보는 PIPA 기준에 따라 비식별화(가명 처리) 후 제공됩니다.\nNDA 체결 투자자에게만 접근 권한이 부여됩니다.",
  },
  {
    question: "매각 기간은 어느 정도 걸리나요?",
    answer:
      "자산 규모와 유형에 따라 다르지만 통상 3~6개월 소요됩니다.\n실사 준비가 완료된 경우 더 빠른 진행도 가능합니다.",
  },
  {
    question: "매각가율은 어떻게 결정되나요?",
    answer:
      "삼일PwC는 OPB 대비 양수도가격의 비율인 매각가율을 유사 거래 사례, 담보물 감정, 연체 기간 등을 종합해 MRP로 제시합니다.\n최종 가율은 입찰 경쟁을 통해 시장에서 결정됩니다.",
  },
  {
    question: "자문 수수료는 어떻게 되나요?",
    answer:
      "수수료 구조는 거래 규모와 복잡성에 따라 협의하여 결정합니다.\n상담 신청 후 미팅 시 구체적인 조건을 안내드립니다.",
  },
];


export default function SellingPage() {
  return (
    <>
      <Navbar />

      {/* ① PageHeader */}
      <PageHeader
        overline="서비스 소개 · 매각 자문"
        title="NPL 매각 자문"
        subtitle="은행·저축은행·캐피탈 등 금융기관의 부실채권 매각을 삼일PwC 전문가가 처음부터 끝까지 함께합니다."
        bgImage="/selling-bg.jpg"
      />

      {/* ② 취급 자산 유형 */}
      <Section bg="white">
        <h2
          className="text-2xl font-semibold"
          style={{ color: "#2D2D2D", lineHeight: 1.3 }}
        >
          취급 자산 유형
        </h2>
        <p className="mt-3 mb-10" style={{ color: "#7D7D7D" }}>
          무담보부터 PF까지, 모든 유형의 NPL 매각을 지원합니다.
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
          className="mt-8 pl-4 text-sm"
          style={{
            borderLeft: "4px solid #FFB600",
            color: "#7D7D7D",
          }}
        >
          NPL성 실물자산(부동산 경공매 물건 등)도 접수 가능합니다. 상담 신청 시 자산 유형과 함께 문의해 주세요.
        </div>
      </Section>

      {/* ③ 왜 삼일PwC에 맡기는가 */}
      <Section bg="dark">
        <h2 className="text-2xl font-semibold text-white" style={{ lineHeight: 1.3 }}>
          왜 삼일PwC에 맡기는가
        </h2>
        <p className="mt-3 text-white" style={{ opacity: 0.7 }}>
          국내 NPL 시장에서 가장 많은 거래를 자문해온 경험이 있습니다.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {STRENGTHS.map((s) => (
            <StrengthCard key={s.title} icon={s.icon} title={s.title} desc={s.desc} />
          ))}
        </div>
      </Section>

      {/* ④ 매각 진행 프로세스 */}
      <Section bg="gray">
        <h2
          className="text-2xl font-semibold"
          style={{ color: "#2D2D2D", lineHeight: 1.3 }}
        >
          매각 진행 프로세스
        </h2>
        <p className="mt-3 mb-12" style={{ color: "#7D7D7D" }}>
          상담 신청부터 거래 종결까지 평균 3~6개월 소요됩니다.
        </p>
        <ProcessSteps steps={SELLING_STEPS} />
      </Section>

      {/* ⑤ 자주 묻는 질문 */}
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
