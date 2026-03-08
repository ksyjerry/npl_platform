import { Building2, TrendingUp } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import ServiceCard from "@/components/home/ServiceCard";
import WhyPwCSection from "@/components/home/WhyPwCSection";
import Section from "@/components/layout/Section";
import ConsultCTA from "@/components/consulting/ConsultCTA";

export const metadata = {
  title: "NPL Platform | 삼일PwC",
  description:
    "삼일PwC NPL 매각·인수 자문 플랫폼. 국내 주요 금융기관과 기관투자자를 연결하는 NPL 전문 디지털 거래 플랫폼입니다.",
  openGraph: {
    title: "NPL Platform | 삼일PwC",
    description: "삼일PwC NPL 매각·인수 자문 플랫폼",
    type: "website",
  },
};

export default function Home() {
  return (
    <>
      <Navbar />

      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Service Cards */}
      <Section bg="white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ServiceCard
            title="매각 자문"
            desc="은행·저축은행·캐피탈 등 금융기관의 부실채권 매각을 지원합니다. 무담보·담보·PF 등 전 자산 유형, Data Disk 작성부터 LSPA 체결까지 삼일PwC 전문가가 함께합니다."
            href="/service/selling"
            cta="매각 상담 신청"
            tags={["무담보 NPL", "담보 NPL", "PF 채권"]}
            icon={<Building2 size={32} />}
          />
          <ServiceCard
            title="인수 자문"
            desc="F&I·자산운용사·기관투자자를 위한 NPL 딜 소싱 및 인수 자문입니다. 적격 투자자 확인부터 Bid Package 검토, 입찰 참여까지 삼일PwC의 네트워크와 경험을 활용하세요."
            href="/service/buying"
            cta="인수 상담 신청"
            tags={["딜 소싱", "입찰 지원", "LSPA 검토"]}
            icon={<TrendingUp size={32} />}
          />
        </div>
      </Section>

      {/* 3. Features — Interactive tabs */}
      <WhyPwCSection />

      {/* 4. Bottom CTA */}
      <ConsultCTA />

      <Footer />
    </>
  );
}
