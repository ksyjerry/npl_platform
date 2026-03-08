"use client";

import { useState, useCallback } from "react";
import { Shield, FileSearch, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Pillar {
  icon: LucideIcon;
  number: string;
  label: string;
  headline: string;
  bullets: { title: string; items: string[] }[];
}

const PILLARS: Pillar[] = [
  {
    icon: Shield,
    number: "01",
    label: "검증된 자문 네트워크",
    headline:
      "국내 주요 금융기관·기관투자자와의 신뢰 관계를 기반으로 적격 매수인을 신속하게 연결합니다.",
    bullets: [
      {
        title: "광범위한 매수인 풀",
        items: [
          "국내 주요 F&I, 자산운용사, 기관투자자 네트워크 보유",
          "제한적 입찰·공개 입찰 방식 모두 운영 가능",
        ],
      },
      {
        title: "글로벌 PwC 연계",
        items: [
          "PwC 글로벌 네트워크를 통한 해외 투자자 접근",
          "크로스보더 거래 자문 경험",
        ],
      },
      {
        title: "신속한 매칭",
        items: [
          "자산 유형별 적격 투자자 데이터베이스 운영",
          "상담 신청 후 영업일 2일 이내 담당자 배정",
        ],
      },
    ],
  },
  {
    icon: FileSearch,
    number: "02",
    label: "체계적인 거래 관리",
    headline:
      "Pool 등록부터 Data Disk, Invitation Letter, LSPA까지 거래의 모든 단계를 단일 플랫폼에서 관리합니다.",
    bullets: [
      {
        title: "거래 전 과정 추적",
        items: [
          "Pool 등록, 자산확정, 입찰, 계약, 종결 전 단계 관리",
          "실시간 진행 상황 확인 및 이력 관리",
        ],
      },
      {
        title: "문서 중앙 관리",
        items: [
          "Data Disk, IL, Bid Package, LSPA 등 핵심 문서 일괄 관리",
          "역할별 문서 접근 권한 자동 적용",
        ],
      },
      {
        title: "데이터 기반 분석",
        items: [
          "과거 유사 거래 낙찰가율 데이터 활용",
          "최적 매각 타이밍·가격 전략 수립 지원",
        ],
      },
    ],
  },
  {
    icon: Lock,
    number: "03",
    label: "역할별 보안 접근",
    headline:
      "매도인·매수인·회계법인 각 역할에 맞게 자료 접근 권한이 분리되어 정보 유출 위험을 차단합니다.",
    bullets: [
      {
        title: "역할 기반 접근 제어(RBAC)",
        items: [
          "매도인·매수인·회계법인 역할별 메뉴 및 데이터 분리",
          "Pool 참여이력 기반 상세정보 열람 제한",
        ],
      },
      {
        title: "파일 보안",
        items: [
          "거래 자료 암호화 저장 및 스트리밍 다운로드",
          "클라이언트에 파일 경로 노출 차단",
        ],
      },
      {
        title: "감사 추적",
        items: [
          "모든 데이터 변경에 대한 감사 로그 기록",
          "수정 사유·IP·수행자 자동 추적",
        ],
      },
    ],
  },
];

export default function WhyPwCSection() {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);

  const switchTab = useCallback(
    (idx: number) => {
      if (idx === active) return;
      setFading(true);
      setTimeout(() => {
        setActive(idx);
        setFading(false);
      }, 200);
    },
    [active],
  );

  const pillar = PILLARS[active];

  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="max-w-5xl mx-auto px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#2D2D2D" }}>
            왜 삼일PwC NPL 플랫폼인가
          </h2>
          <p className="mt-3" style={{ color: "#7D7D7D", fontSize: "15px" }}>
            국내 NPL 시장을 주도해온 삼일PwC의 자문 역량을 디지털 플랫폼에 담았습니다.
          </p>
        </div>

        {/* Tab selector — modern card style */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {PILLARS.map((p, i) => {
            const isActive = i === active;
            const Icon = p.icon;
            return (
              <button
                key={i}
                onClick={() => switchTab(i)}
                className="relative flex flex-col items-center px-4 py-6 rounded-lg transition-all duration-300"
                style={{
                  backgroundColor: isActive ? "#FFF5EE" : "#F8F8F8",
                  boxShadow: isActive ? "0 4px 16px rgba(208,74,2,0.10)" : "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = "#F0F0F0";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = "#F8F8F8";
                }}
              >
                {/* Number badge */}
                <span
                  className="text-xs font-bold mb-3 px-2.5 py-0.5 rounded-full transition-colors duration-300"
                  style={{
                    backgroundColor: isActive ? "#D04A02" : "#E8E8E8",
                    color: isActive ? "#FFFFFF" : "#7D7D7D",
                  }}
                >
                  {p.number}
                </span>
                {/* Icon */}
                <div className="mb-3">
                  <Icon
                    size={32}
                    strokeWidth={1.5}
                    color={isActive ? "#D04A02" : "#ABABAB"}
                    className="transition-colors duration-300"
                  />
                </div>
                {/* Label */}
                <span
                  className="text-base font-bold text-center transition-colors duration-300"
                  style={{ color: isActive ? "#2D2D2D" : "#7D7D7D" }}
                >
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content panel */}
        <div
          className="rounded-lg overflow-hidden"
          style={{
            border: "1px solid #EEEEEE",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          {/* Orange top line */}
          <div style={{ height: "3px", background: "linear-gradient(90deg, #D04A02, #EB8C00)" }} />

          <div
            className="p-8 md:p-10 transition-all duration-300 ease-out"
            style={{
              opacity: fading ? 0 : 1,
              transform: fading ? "translateY(8px)" : "translateY(0)",
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {/* Left: headline (2 cols) */}
              <div className="md:col-span-2">
                <div
                  className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full"
                  style={{ backgroundColor: "#FFF5EE" }}
                >
                  <span className="text-xs font-bold" style={{ color: "#D04A02" }}>
                    {pillar.number}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: "#D04A02" }}>
                    {pillar.label}
                  </span>
                </div>
                <p
                  className="text-lg md:text-xl font-bold leading-relaxed"
                  style={{ color: "#2D2D2D" }}
                >
                  {pillar.headline}
                </p>
              </div>

              {/* Right: detail cards (3 cols) */}
              <div className="md:col-span-3 grid grid-cols-1 gap-4">
                {pillar.bullets.map((b, j) => (
                  <div
                    key={j}
                    className="p-4 rounded-lg transition-colors"
                    style={{ backgroundColor: "#FAFAFA" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FFF5EE")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FAFAFA")}
                  >
                    <p className="text-base font-bold mb-2 flex items-center gap-2" style={{ color: "#2D2D2D" }}>
                      <span
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "4px",
                          backgroundColor: "#D04A02",
                          color: "#FFFFFF",
                          fontSize: "11px",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {j + 1}
                      </span>
                      {b.title}
                    </p>
                    {b.items.map((item, k) => (
                      <p
                        key={k}
                        className="text-sm pl-7 flex items-start gap-1.5"
                        style={{ color: "#464646", lineHeight: 1.8 }}
                      >
                        <span className="mt-2 shrink-0" style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "#D04A02", display: "inline-block" }} />
                        {item}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
