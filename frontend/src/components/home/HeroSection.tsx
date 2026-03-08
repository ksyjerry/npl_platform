import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section
      className="relative flex items-center overflow-hidden"
      style={{ minHeight: "600px" }}
    >
      {/* Background image */}
      <Image
        src="/hero-bg.jpg"
        alt=""
        fill
        className="object-cover"
        priority
      />
      {/* Dark overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(45,45,45,0.65)" }}
      />

      {/* Content — left-center */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 md:px-16 lg:px-24 py-16 my-auto">
        <div>
          <p
            className="text-xs font-medium uppercase"
            style={{
              color: "rgba(255,255,255,0.6)",
              letterSpacing: "0.12em",
            }}
          >
            Samil PricewaterhouseCoopers · NPL Advisory
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold mt-4 whitespace-pre-line"
            style={{ color: "white", lineHeight: 1.15 }}
          >
            {"국내 최대 NPL 자문사의\n거래 플랫폼"}
          </h1>
          <p
            className="text-lg mt-6 max-w-xl whitespace-pre-line"
            style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.65 }}
          >
            {"삼일PwC가 자문한 수백 건의 NPL 거래 경험을 디지털 플랫폼으로 제공합니다.\n매각부터 인수까지, 전 과정을 한 곳에서."}
          </p>
          <div className="flex gap-4 mt-10">
            <Link
              href="/service/selling"
              className="text-white font-semibold transition-colors"
              style={{
                backgroundColor: "#D04A02",
                borderRadius: "4px",
                padding: "14px 32px",
              }}
            >
              매각 자문 상담
            </Link>
            <Link
              href="/service/buying"
              className="text-white font-semibold border-2 border-white transition-colors hover:bg-white hover:text-gray-800"
              style={{ borderRadius: "4px", padding: "14px 32px" }}
            >
              인수 기회 탐색
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
