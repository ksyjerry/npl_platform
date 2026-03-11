"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { usePoolDetail } from "@/hooks/usePools";
import PoolDetailForm from "@/components/pools/PoolDetailForm";
import PoolDocumentSection from "@/components/pools/PoolDocumentSection";
import { parseTokenPayload, getAccessToken } from "@/lib/auth";
import { can } from "@/lib/rbac";

const TABS = [
  { value: "info", label: "거래 정보" },
  { value: "documents", label: "거래 자료" },
  { value: "bonds", label: "채권 정보" },
];

export default function PoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const poolId = parseInt(id, 10);
  const { pool, loading, error, refresh } = usePoolDetail(poolId);
  const [activeTab, setActiveTab] = useState("info");

  // Get current user role from token
  const token = getAccessToken();
  const payload = token ? parseTokenPayload(token) : null;
  const userRole = (payload?.role as string) || "";
  const canEdit = can(userRole, "pool:write");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{ borderColor: "#DEDEDE", borderTopColor: "#D04A02" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2" style={{ color: "#E0301E" }}>
            {error}
          </p>
          <Link
            href="/pools"
            className="text-sm font-medium hover:underline"
            style={{ color: "#D04A02" }}
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!pool) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Breadcrumb */}
      <div
        className="px-8 py-3 text-sm"
        style={{ backgroundColor: "#F5F5F5", borderBottom: "1px solid #DEDEDE", color: "#7D7D7D" }}
      >
        <Link href="/pools" className="hover:underline" style={{ color: "#7D7D7D" }}>
          거래현황
        </Link>
        <span className="mx-2">{">"}</span>
        <span style={{ color: "#2D2D2D" }}>{pool.name}</span>
      </div>

      {/* Tabs (CR-11) */}
      <div className="flex gap-6 px-8" style={{ borderBottom: "1px solid #DEDEDE" }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="pb-3 pt-4 text-sm font-semibold transition-colors"
              style={{
                color: isActive ? "#D04A02" : "#7D7D7D",
                borderBottom: isActive ? "2px solid #D04A02" : "2px solid transparent",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        {activeTab === "info" && (
          <PoolDetailForm pool={pool} canEdit={canEdit} onUpdated={refresh} />
        )}
        {activeTab === "documents" && (
          <PoolDocumentSection poolId={poolId} canUpload={canEdit} />
        )}
        {activeTab === "bonds" && (
          <BondSummarySection poolId={poolId} />
        )}
      </div>
    </div>
  );
}

// CR-02: Bond summary section
function BondSummarySection({ poolId }: { poolId: number }) {
  const [summary, setSummary] = useState<{
    total_bond_count: number;
    total_opb: number;
    total_balance: number;
    by_debtor_type: { label: string; bond_count: number; total_opb: number; total_balance: number }[];
    by_product_type: { label: string; bond_count: number; total_opb: number; total_balance: number }[];
    by_collateral_type: { label: string; bond_count: number; total_opb: number; total_balance: number }[];
    by_overdue_range: { label: string; bond_count: number; total_opb: number; total_balance: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryTab, setSummaryTab] = useState("debtor_type");

  useEffect(() => {
    import("@/lib/api").then(({ default: api }) => {
      api.get(`/bonds/summary`, { params: { pool_id: poolId } })
        .then((res) => setSummary(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, [poolId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-4 rounded-full animate-spin" style={{ borderColor: "#DEDEDE", borderTopColor: "#D04A02" }} />
      </div>
    );
  }

  if (!summary) {
    return <div className="text-center py-8 text-sm" style={{ color: "#7D7D7D" }}>채권 정보가 없습니다.</div>;
  }

  const formatNum = (n: number) => n.toLocaleString("ko-KR");

  const tabData: Record<string, { label: string; bond_count: number; total_opb: number; total_balance: number }[]> = {
    debtor_type: summary.by_debtor_type,
    product_type: summary.by_product_type,
    collateral_type: summary.by_collateral_type,
    overdue_range: summary.by_overdue_range,
  };

  const tabLabels: Record<string, string> = {
    debtor_type: "차주구분별",
    product_type: "상품유형별",
    collateral_type: "담보유형별",
    overdue_range: "연체기간별",
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border p-4" style={{ borderColor: "#DEDEDE", borderRadius: "4px" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "#7D7D7D" }}>총 채권수</p>
          <p className="text-xl font-bold" style={{ color: "#2D2D2D" }}>{formatNum(summary.total_bond_count)}</p>
        </div>
        <div className="border p-4" style={{ borderColor: "#DEDEDE", borderRadius: "4px" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "#7D7D7D" }}>총 OPB</p>
          <p className="text-xl font-bold" style={{ color: "#2D2D2D" }}>{formatNum(summary.total_opb)}원</p>
        </div>
        <div className="border p-4" style={{ borderColor: "#DEDEDE", borderRadius: "4px" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "#7D7D7D" }}>총 합계잔액</p>
          <p className="text-xl font-bold" style={{ color: "#2D2D2D" }}>{formatNum(summary.total_balance)}원</p>
        </div>
      </div>

      {/* Group tabs */}
      <div className="flex gap-2">
        {Object.entries(tabLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSummaryTab(key)}
            className="px-4 py-2 text-sm font-medium"
            style={{
              borderRadius: "4px",
              backgroundColor: summaryTab === key ? "#D04A02" : "white",
              color: summaryTab === key ? "white" : "#2D2D2D",
              border: summaryTab === key ? "none" : "1px solid #DEDEDE",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Summary table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "#2D2D2D" }}>
              {["구분", "채권수", "OPB", "합계잔액"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold text-white text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(tabData[summaryTab] || []).map((row, idx) => (
              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA", borderBottom: "1px solid #DEDEDE" }}>
                <td className="px-4 py-3" style={{ color: "#2D2D2D" }}>{row.label}</td>
                <td className="px-4 py-3">{formatNum(row.bond_count)}</td>
                <td className="px-4 py-3">{formatNum(row.total_opb)}</td>
                <td className="px-4 py-3">{formatNum(row.total_balance)}</td>
              </tr>
            ))}
            {(!tabData[summaryTab] || tabData[summaryTab].length === 0) && (
              <tr><td colSpan={4} className="px-4 py-8 text-center" style={{ color: "#7D7D7D" }}>데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
