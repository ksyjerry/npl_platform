"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "회원가입 후 바로 이용할 수 있나요?",
    a: "아니요. 회원가입 후 관리자의 인증 처리가 완료되어야 서비스를 이용할 수 있습니다. 인증 완료 시 별도로 안내드립니다.",
  },
  {
    q: "Pool 상세 정보는 누구나 볼 수 있나요?",
    a: "종결된(closed) Pool은 해당 거래에 참여 이력이 있는 업체만 상세 정보를 열람할 수 있습니다. 진행 중(active) Pool은 기본 정보만 제공됩니다.",
  },
  {
    q: "거래자료는 어떻게 등록하나요?",
    a: "역할(매도인/매수인/회계법인)에 따라 접근 가능한 거래자료 탭이 다릅니다. 해당 역할의 거래자료 메뉴에서 파일을 업로드할 수 있습니다.",
  },
  {
    q: "상담 신청은 어떻게 하나요?",
    a: "매각 자문 또는 인수 자문 페이지에서 '상담 신청하기' 버튼을 클릭하여 신청할 수 있습니다. 담당 전문가가 검토 후 연락드립니다.",
  },
  {
    q: "비밀번호를 잊어버렸어요.",
    a: "관리자에게 비밀번호 초기화를 요청해주세요. 임시 비밀번호가 발급되면 로그인 후 변경하실 수 있습니다.",
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Title bar */}
      <div className="px-8 py-5" style={{ borderBottom: "1px solid #DEDEDE" }}>
        <h1 className="text-xl font-bold" style={{ color: "#2D2D2D" }}>
          자주 묻는 질문
        </h1>
        <p className="text-sm mt-1" style={{ color: "#7D7D7D" }}>
          플랫폼 이용에 대해 자주 묻는 질문과 답변입니다.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-8">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              style={{
                borderBottom: "1px solid #DEDEDE",
                borderLeft: isOpen ? "4px solid #D04A02" : "4px solid transparent",
              }}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full text-left px-4 py-4 flex items-center justify-between cursor-pointer"
              >
                <span
                  className="text-base font-semibold"
                  style={{ color: "#2D2D2D" }}
                >
                  Q{i + 1}. {item.q}
                </span>
                <svg
                  className="w-5 h-5 flex-shrink-0 transition-transform"
                  style={{
                    color: "#7D7D7D",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div className="px-4 pb-4">
                  <p className="text-sm leading-relaxed" style={{ color: "#464646" }}>
                    {item.a}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
