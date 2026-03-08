"use client";

import { useState } from "react";

const GLOSSARY = [
  {
    term: "NPL (Non-Performing Loan)",
    definition:
      "금융기관의 대출금 중 3개월 이상 연체된 고정이하여신 등을 의미하며, 부실채권으로 통칭합니다.",
  },
  {
    term: "자산확정일 (Cut-off Date)",
    definition:
      "자산의 가치를 평가하는 기준이 되는 날짜입니다. 이 날짜를 기준으로 채권의 잔액, 연체 상태 등을 확정합니다.",
  },
  {
    term: "매각대상자산",
    definition: "매각 절차를 통해 판매될 NPL 등의 자산을 의미합니다.",
  },
  {
    term: "Data Disk",
    definition:
      "매각대상자산에 대한 상세 정보(차주 정보, 채권 정보 등)가 담겨 있는 Excel 자료를 의미합니다.",
  },
  {
    term: "Invitation Letter (IL)",
    definition:
      "'입찰참가권유서'로, 매각 주관사가 잠재적 투자자들에게 입찰 참여를 공식적으로 권유하며 보내는 문서입니다.",
  },
  {
    term: "입찰참가의향서 (Letter of Intent, LOI)",
    definition:
      "투자자가 입찰에 참여할 의사가 있음을 공식적으로 밝히는 서류입니다.",
  },
  {
    term: "비밀유지서약서 (Non-Disclosure Agreement, NDA)",
    definition:
      "거래 과정에서 알게 된 비밀 정보를 외부에 유출하지 않겠다고 약속하는 서류입니다.",
  },
  {
    term: "적격 투자자",
    definition:
      "매각 주관사가 정한 일정 기준(자산 규모, 투자 경험 등)을 충족하여 입찰에 참여할 자격이 있다고 인정한 투자자입니다.",
  },
  {
    term: "Bid Package",
    definition:
      "입찰에 참여하는 데 필요한 모든 서류 묶음을 의미합니다. 보통 입찰안내서, Data Disk, LSPA, Interim, 입찰가격배분표 등을 포함합니다.",
  },
  {
    term: "자산양수도계약서 (Loan Sale & Purchase Agreement, LSPA)",
    definition:
      "채권(자산)을 사고파는 계약을 체결할 때 작성하는 공식적인 계약서입니다.",
  },
  {
    term: "Interim",
    definition:
      "Cut-off Date 이후부터 거래종결일까지의 '임시자산관리기간' 동안 발생한 순회수금(Interim Collection) 등을 의미합니다.",
  },
];

export default function GlossaryPage() {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? GLOSSARY.filter(
        (g) =>
          g.term.toLowerCase().includes(search.toLowerCase()) ||
          g.definition.toLowerCase().includes(search.toLowerCase())
      )
    : GLOSSARY;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Title bar */}
      <div
        className="px-8 py-5 flex items-center justify-between gap-4 flex-wrap"
        style={{ borderBottom: "1px solid #DEDEDE" }}
      >
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#2D2D2D" }}>
            용어사전
          </h1>
          <p className="text-sm mt-1" style={{ color: "#7D7D7D" }}>
            NPL 거래에서 자주 사용되는 주요 용어를 정리했습니다.
          </p>
        </div>
        <input
          type="text"
          placeholder="용어 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm border px-4 py-2 w-full sm:w-64 outline-none transition-colors"
          style={{
            borderColor: "#DEDEDE",
            borderRadius: "4px",
            color: "#2D2D2D",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#D04A02")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#DEDEDE")}
        />
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: "#7D7D7D" }}>
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className="space-y-0">
            {filtered.map((item, i) => (
              <div
                key={i}
                className="flex gap-6 py-6 transition-colors"
                style={{
                  borderBottom: "1px solid #DEDEDE",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#FAFAFA")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <span
                  className="text-sm font-bold shrink-0 flex items-center justify-center rounded-full"
                  style={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: "#FFF5EE",
                    color: "#D04A02",
                    marginTop: "2px",
                  }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h3
                    className="text-base font-semibold"
                    style={{ color: "#2D2D2D" }}
                  >
                    {item.term}
                  </h3>
                  <p
                    className="text-sm mt-2 leading-relaxed"
                    style={{ color: "#464646" }}
                  >
                    {item.definition}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
