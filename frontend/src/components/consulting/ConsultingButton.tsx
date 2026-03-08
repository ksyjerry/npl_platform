"use client";

import { useState } from "react";
import ConsultingModal from "./ConsultingModal";

interface ConsultingButtonProps {
  type: "selling" | "buying";
}

export default function ConsultingButton({ type }: ConsultingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-white text-lg font-semibold transition-colors"
        style={{
          backgroundColor: "#D04A02",
          borderRadius: "4px",
          padding: "16px 40px",
        }}
      >
        {type === "selling" ? "매각" : "인수"} 상담 신청하기
      </button>
      <ConsultingModal
        type={type}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
