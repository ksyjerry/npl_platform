"use client";

import { useState } from "react";

interface ReasonModalProps {
  isOpen: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  title?: string;
}

export default function ReasonModal({
  isOpen,
  onConfirm,
  onCancel,
  title = "수정 사유 입력",
}: ReasonModalProps) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="bg-white w-full max-w-[520px] mx-4"
        style={{
          borderRadius: "4px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 pt-6 pb-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid #DEDEDE" }}
        >
          <h3 className="text-lg font-bold" style={{ color: "#2D2D2D" }}>
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="text-lg hover:opacity-70 cursor-pointer"
            style={{ color: "#7D7D7D" }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <textarea
            placeholder="수정 사유를 입력해주세요. (필수)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border text-sm outline-none resize-none"
            rows={4}
            style={{
              borderColor: "#DEDEDE",
              borderRadius: "4px",
              padding: "10px 14px",
              color: "#2D2D2D",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#D04A02";
              e.target.style.boxShadow = "0 0 0 2px rgba(208,74,2,0.2)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#DEDEDE";
              e.target.style.boxShadow = "none";
            }}
            autoFocus
          />
        </div>

        {/* Footer */}
        <div
          className="px-6 pb-6 pt-4 flex justify-end gap-3"
          style={{ borderTop: "1px solid #DEDEDE" }}
        >
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold border-2 transition-colors cursor-pointer"
            style={{
              borderColor: "#D04A02",
              color: "#D04A02",
              borderRadius: "4px",
            }}
          >
            취소
          </button>
          <button
            disabled={!reason.trim()}
            onClick={() => {
              onConfirm(reason);
              setReason("");
            }}
            className="px-4 py-2 text-sm font-semibold text-white transition-colors"
            style={{
              backgroundColor: reason.trim() ? "#D04A02" : "rgba(208,74,2,0.4)",
              borderRadius: "4px",
              cursor: reason.trim() ? "pointer" : "not-allowed",
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
