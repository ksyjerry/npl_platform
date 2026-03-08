"use client";

import Link from "next/link";
import { usePools } from "@/hooks/usePools";
import PoolTable from "@/components/pools/PoolTable";
import { getAccessToken, parseTokenPayload } from "@/lib/auth";
import { can } from "@/lib/rbac";

const STATUS_TABS = [
  { value: undefined, label: "전체" },
  { value: "active", label: "진행" },
  { value: "closed", label: "종결" },
];

export default function PoolsPage() {
  const { items, total, page, setPage, status, setStatus, loading, error, size } =
    usePools();

  const totalPages = Math.ceil(total / size);

  const token = getAccessToken();
  const payload = token ? parseTokenPayload(token) : null;
  const role = (payload?.role as string) || "";
  const canWrite = can(role, "pool:write");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Page title bar */}
      <div className="px-8 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #DEDEDE" }}>
        <div>
          <h2 className="text-xl font-bold" style={{ color: "#2D2D2D" }}>
            거래현황
          </h2>
          <p className="text-sm mt-1" style={{ color: "#7D7D7D" }}>
            Pool 목록 및 상세정보를 확인할 수 있습니다.
          </p>
        </div>
        {canWrite && (
          <Link
            href="/pools/new"
            className="px-4 py-2 text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: "#D04A02", borderRadius: "4px" }}
          >
            + Pool 등록
          </Link>
        )}
      </div>

      {/* Filter tabs */}
      <div
        className="px-8 py-3 flex gap-2"
        style={{ backgroundColor: "#F5F5F5", borderBottom: "1px solid #DEDEDE" }}
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              borderRadius: "4px",
              backgroundColor: status === tab.value ? "#D04A02" : "white",
              color: status === tab.value ? "white" : "#2D2D2D",
              border: status === tab.value ? "none" : "1px solid #DEDEDE",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div
              className="w-8 h-8 border-4 rounded-full animate-spin"
              style={{ borderColor: "#DEDEDE", borderTopColor: "#D04A02" }}
            />
          </div>
        ) : error ? (
          <div className="text-center py-16" style={{ color: "#E0301E" }}>
            {error}
          </div>
        ) : (
          <PoolTable items={items} startIndex={(page - 1) * size} />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-8 py-4 flex justify-end gap-1">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 text-sm border"
            style={{
              borderColor: "#DEDEDE",
              borderRadius: "4px",
              color: page <= 1 ? "#DEDEDE" : "#2D2D2D",
              cursor: page <= 1 ? "not-allowed" : "pointer",
            }}
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className="px-3 py-1.5 text-sm border"
              style={{
                borderRadius: "4px",
                backgroundColor: p === page ? "#D04A02" : "white",
                color: p === page ? "white" : "#2D2D2D",
                borderColor: p === page ? "#D04A02" : "#DEDEDE",
              }}
            >
              {p}
            </button>
          ))}
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 text-sm border"
            style={{
              borderColor: "#DEDEDE",
              borderRadius: "4px",
              color: page >= totalPages ? "#DEDEDE" : "#2D2D2D",
              cursor: page >= totalPages ? "not-allowed" : "pointer",
            }}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
