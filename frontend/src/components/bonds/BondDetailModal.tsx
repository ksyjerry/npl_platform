"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getColumnsForType, groupColumns, type BondColumnDef } from "@/lib/bond-columns";

const BOND_TYPE_LABELS: Record<string, string> = {
  A: "일반무담보채권",
  B1: "채무조정채권(CCRS)",
  B2: "채무조정채권(IRL)",
  C: "담보채권",
};

interface BondDetailData {
  id: number;
  pool_id: number;
  bond_type: string | null;
  bond_no: string | null;
  debtor_type: string | null;
  debtor_id_masked: string | null;
  creditor: string | null;
  product_type: string | null;
  collateral_type: string | null;
  collateral_address: string | null;
  original_amount: number | null;
  opb: number | null;
  interest_balance: number | null;
  total_balance: number | null;
  overdue_start_date: string | null;
  overdue_months: number | null;
  legal_status: string | null;
  transfer_count: number | null;
  extra_data: Record<string, unknown> | null;
}

function formatValue(val: unknown, type: BondColumnDef["type"]): string {
  if (val === null || val === undefined || val === "") return "—";
  if (type === "number") {
    const n = typeof val === "number" ? val : Number(val);
    if (isNaN(n)) return String(val);
    return n.toLocaleString("ko-KR");
  }
  if (type === "date") {
    // Excel serial number → Date
    const num = typeof val === "number" ? val : Number(val);
    if (!isNaN(num) && num > 1 && num < 100000) {
      const d = new Date(Date.UTC(1899, 11, 30 + num));
      return d.toISOString().substring(0, 10);
    }
    const s = String(val);
    if (s.length >= 10) return s.substring(0, 10);
    return s;
  }
  return String(val);
}

function formatNum(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString("ko-KR");
}

interface Props {
  bondId: number;
  onClose: () => void;
}

export default function BondDetailModal({ bondId, onClose }: Props) {
  const [bond, setBond] = useState<BondDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    api
      .get(`/bonds/detail/${bondId}`)
      .then((res) => setBond(res.data))
      .catch(() => setError("채권 상세 정보를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, [bondId]);

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  // Common fields section
  const commonFields: { label: string; value: string }[] = bond
    ? [
        { label: "채권번호", value: bond.bond_no || "—" },
        { label: "채권유형", value: bond.bond_type ? (BOND_TYPE_LABELS[bond.bond_type] || bond.bond_type) : "—" },
        { label: "차주구분", value: bond.debtor_type || "—" },
        { label: "고객번호", value: bond.debtor_id_masked || "—" },
        { label: "금융회사명", value: bond.creditor || "—" },
        { label: "상품유형", value: bond.product_type || "—" },
        { label: "담보유형", value: bond.collateral_type || "—" },
        { label: "담보소재지", value: bond.collateral_address || "—" },
        { label: "양도횟수", value: bond.transfer_count != null ? String(bond.transfer_count) : "—" },
        { label: "원금", value: formatNum(bond.original_amount) },
        { label: "OPB", value: formatNum(bond.opb) },
        { label: "이자잔액", value: formatNum(bond.interest_balance) },
        { label: "합계잔액", value: formatNum(bond.total_balance) },
        { label: "연체시작일", value: bond.overdue_start_date || "—" },
        { label: "연체기간(월)", value: bond.overdue_months != null ? String(bond.overdue_months) : "—" },
        { label: "법적상태", value: bond.legal_status || "—" },
      ]
    : [];

  const bondType = bond?.bond_type || "A";
  const extraColumns = getColumnsForType(bondType);
  const groupedColumns = groupColumns(extraColumns);
  const extraData = bond?.extra_data || {};

  // Check if any stage groups have data (for B1 accordion)
  const isStageGroup = (group: string) => group.includes("단계 변제계획");

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl"
        style={{ borderRadius: "8px" }}
      >
        {/* Header */}
        <div
          className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 z-10"
          style={{ borderBottom: "1px solid #DEDEDE" }}
        >
          <h2 className="text-lg font-bold" style={{ color: "#2D2D2D" }}>
            채권 상세정보
          </h2>
          <button
            onClick={onClose}
            className="text-xl leading-none px-2 py-1 hover:opacity-70 cursor-pointer"
            style={{ color: "#7D7D7D" }}
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {loading && (
            <div className="flex justify-center py-8">
              <div
                className="w-6 h-6 border-4 rounded-full animate-spin"
                style={{ borderColor: "#DEDEDE", borderTopColor: "#D04A02" }}
              />
            </div>
          )}

          {error && (
            <p className="text-center py-8 text-sm" style={{ color: "#E0301E" }}>
              {error}
            </p>
          )}

          {bond && !loading && (
            <>
              {/* Common fields */}
              <div>
                <h3
                  className="text-sm font-bold mb-3 pb-2"
                  style={{ color: "#2D2D2D", borderBottom: "2px solid #D04A02" }}
                >
                  기본 정보
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {commonFields.map((f) => (
                    <div key={f.label} className="flex py-1.5" style={{ borderBottom: "1px solid #F0F0F0" }}>
                      <span className="text-xs font-medium w-28 shrink-0" style={{ color: "#7D7D7D" }}>
                        {f.label}
                      </span>
                      <span className="text-sm" style={{ color: "#2D2D2D" }}>
                        {f.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extra data by group — show all columns for this bond type */}
              {groupedColumns.length > 0 && (
                <div className="space-y-4">
                  {groupedColumns.map(({ group, columns }) => {
                    const isStage = isStageGroup(group);
                    const isCollapsed = collapsedGroups.has(group);
                    const filledCount = columns.filter((col) => {
                      const v = extraData[col.key];
                      return v !== null && v !== undefined && v !== "";
                    }).length;

                    return (
                      <div key={group}>
                        <button
                          onClick={() => toggleGroup(group)}
                          className="w-full flex items-center justify-between text-sm font-bold pb-2 mb-3 cursor-pointer"
                          style={{ color: "#2D2D2D", borderBottom: "2px solid #DEDEDE" }}
                        >
                          <span>
                            {group}
                            <span className="font-normal text-xs ml-2" style={{ color: "#7D7D7D" }}>
                              ({filledCount}/{columns.length}개 항목)
                            </span>
                          </span>
                          <span style={{ color: "#7D7D7D", fontSize: "12px" }}>
                            {isCollapsed ? "+" : "−"}
                          </span>
                        </button>
                        {!isCollapsed && (
                          <div className={`grid ${isStage ? "grid-cols-1" : "grid-cols-2"} gap-x-6 gap-y-1`}>
                            {columns.map((col) => (
                              <div
                                key={col.key}
                                className="flex py-1.5"
                                style={{ borderBottom: "1px solid #F0F0F0" }}
                              >
                                <span
                                  className="text-xs font-medium shrink-0"
                                  style={{ color: "#7D7D7D", width: isStage ? "200px" : "112px" }}
                                >
                                  {col.label}
                                </span>
                                <span className="text-sm" style={{ color: "#2D2D2D" }}>
                                  {formatValue(extraData[col.key], col.type)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* If extra_data has keys not in metadata, show them */}
              {bond.extra_data && (() => {
                const knownKeys = new Set(extraColumns.map((c) => c.key));
                const unknownEntries = Object.entries(bond.extra_data).filter(
                  ([k, v]) => !knownKeys.has(k) && v !== null && v !== undefined && v !== ""
                );
                if (unknownEntries.length === 0) return null;
                return (
                  <div>
                    <h3
                      className="text-sm font-bold mb-3 pb-2"
                      style={{ color: "#2D2D2D", borderBottom: "2px solid #DEDEDE" }}
                    >
                      추가 데이터
                    </h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                      {unknownEntries.map(([k, v]) => (
                        <div key={k} className="flex py-1.5" style={{ borderBottom: "1px solid #F0F0F0" }}>
                          <span className="text-xs font-medium w-28 shrink-0" style={{ color: "#7D7D7D" }}>
                            {k}
                          </span>
                          <span className="text-sm" style={{ color: "#2D2D2D" }}>
                            {String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
