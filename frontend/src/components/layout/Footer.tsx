import Image from "next/image";

const FOOTER_LINKS = [
  { label: "개인정보 처리방침" },
  { label: "Cookie policy" },
  { label: "Legal disclaimer" },
  { label: "About site provider" },
  { label: "Site map" },
];

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#F5F5F5" }}>
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Top: Logo + Info */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          <Image
            src="/pwc-logo.png"
            alt="PwC"
            width={56}
            height={28}
            style={{ objectFit: "contain", width: "auto", height: "auto" }}
            className="flex-shrink-0"
          />
          <div className="text-sm leading-relaxed" style={{ color: "#2D2D2D" }}>
            <p>
              © 2015 - {new Date().getFullYear()} PwC. Samil PricewaterhouseCoopers. All rights reserved.
              <span style={{ color: "#7D7D7D" }}> | </span>삼일PwC
              <span style={{ color: "#7D7D7D" }}> | </span>대표이사 윤훈수
              <span style={{ color: "#7D7D7D" }}> | </span>주소: 서울특별시
            </p>
            <p>
              용산구 한강대로 100
              <span style={{ color: "#7D7D7D" }}> | </span>사업자등록번호: 106-81-19621
            </p>
          </div>
        </div>

        {/* Bottom: Links */}
        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <span
              key={link.label}
              className="text-sm"
              style={{ color: "#2D2D2D" }}
            >
              {link.label}
            </span>
          ))}
          <span className="text-sm" style={{ color: "#2D2D2D" }}>
            Offices worldwide{" "}
            <svg
              className="inline w-3 h-3 ml-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
          </span>
        </div>
      </div>
    </footer>
  );
}
