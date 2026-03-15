"use client";

import { useState } from "react";
import { Building2, Hexagon } from "lucide-react";
import ConsultingModal from "./ConsultingModal";

export default function ConsultCTA() {
  const [modalType, setModalType] = useState<"selling" | "buying" | null>(null);

  return (
    <>
      <section style={{ backgroundColor: "#F5F5F5" }}>
        <div className="max-w-5xl mx-auto px-8 py-16 md:py-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Left: Text */}
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "#2D2D2D" }}>
              NPL 전문가와 상담해 보세요.
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#7D7D7D" }}>
              귀하의 NPL 거래 목표 달성을 위한 최적의 솔루션을 제안해 드립니다.
            </p>
          </div>

          {/* Right: Buttons */}
          <div className="flex gap-4 shrink-0">
            <button
              onClick={() => setModalType("selling")}
              className="flex items-center gap-3 px-7 py-3.5 bg-white text-sm font-semibold transition-shadow hover:shadow-md cursor-pointer"
              style={{
                color: "#2D2D2D",
                border: "1.5px solid #DEDEDE",
                borderRadius: "9999px",
              }}
            >
              <Building2 size={20} color="#7D7D7D" />
              매각 상담 신청
            </button>
            <button
              onClick={() => setModalType("buying")}
              className="flex items-center gap-3 px-7 py-3.5 bg-white text-sm font-semibold transition-shadow hover:shadow-md cursor-pointer"
              style={{
                color: "#D04A02",
                border: "1.5px solid #D04A02",
                borderRadius: "9999px",
              }}
            >
              <Hexagon size={20} color="#D04A02" />
              인수 상담 신청
            </button>
          </div>
        </div>
      </section>

      {modalType && (
        <ConsultingModal
          type={modalType}
          isOpen={true}
          onClose={() => setModalType(null)}
        />
      )}
    </>
  );
}
