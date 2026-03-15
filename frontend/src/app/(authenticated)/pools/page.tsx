"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePools } from "@/hooks/usePools";
import PoolTable from "@/components/pools/PoolTable";
import { getAccessToken, parseTokenPayload } from "@/lib/auth";
import { can } from "@/lib/rbac";
import api from "@/lib/api";

const STATUS_TABS = [
  { value: undefined, label: "전체" },
  { value: "active", label: "진행" },
  { value: "closed", label: "종결" },
  { value: "cancelled", label: "중단/유찰" },
];

const VIEW_TABS = [
  { value: "pool", label: "Pool별" },
  { value: "seller", label: "매도인별" },
];

interface SellerItem {
  pool_id: number;
  pool_name: string;
  status: string;
  seller_company_id: number;
  seller_name: string;
  collateral_large: string[] | null;
  collateral_small: string[] | null;
  bid_date: string | null;
  closing_date: string | null;
  buyer_name: string[] | null;
  opb: number | null;
  sale_price: number | null;
  sale_ratio: number | null;
  can_view_detail: boolean;
}

export default function PoolsPage() {
  const { items, total, page, setPage, status, setStatus, filters, setFilters, loading, error, size } =
    usePools();

  const [viewTab, setViewTab] = useState<"pool" | "seller">("pool");

  // Seller tab state
  const [sellerItems, setSellerItems] = useState<SellerItem[]>([]);
  const [sellerTotal, setSellerTotal] = useState(0);
  const [sellerPage, setSellerPage] = useState(1);
  const [sellerLoading, setSellerLoading] = useState(false);
  const sellerSize = 20;

  // Filter bar state (local with debounce)
  const [filterName, setFilterName] = useState("");
  const [filterSeller, setFilterSeller] = useState("");
  const [filterClosingFrom, setFilterClosingFrom] = useState("");
  const [filterClosingTo, setFilterClosingTo] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters({
        name: filterName || undefined,
        seller_name: filterSeller || undefined,
        closing_from: filterClosingFrom || undefined,
        closing_to: filterClosingTo || undefined,
      });
      setPage(1);
      setSellerPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filterName, filterSeller, filterClosingFrom, filterClosingTo]);

  // Fetch seller data
  const fetchSellerData = useCallback(async () => {
    setSellerLoading(true);
    try {
      const params: Record<string, unknown> = { page: sellerPage, size: sellerSize };
      if (status) params.status = status;
      if (filters.name) params.name = filters.name;
      if (filters.seller_name) params.seller_name = filters.seller_name;
      if (filters.closing_from) params.closing_from = filters.closing_from;
      if (filters.closing_to) params.closing_to = filters.closing_to;
      const { data } = await api.get("/pools/by-seller", { params });
      setSellerItems(data.items);
      setSellerTotal(data.total);
    } catch {
      setSellerItems([]);
      setSellerTotal(0);
    } finally {
      setSellerLoading(false);
    }
  }, [sellerPage, status, filters]);

  useEffect(() => {
    if (viewTab === "seller") {
      fetchSellerData();
    }
  }, [viewTab, fetchSellerData]);

  const resetFilters = () => {
    setFilterName("");
    setFilterSeller("");
    setFilterClosingFrom("");
    setFilterClosingTo("");
  };

  const totalPages = viewTab === "pool" ? Math.ceil(total / size) : Math.ceil(sellerTotal / sellerSize);
  const currentPage = viewTab === "pool" ? page : sellerPage;
  const setCurrentPage = viewTab === "pool" ? setPage : setSellerPage;
  const isLoading = viewTab === "pool" ? loading : sellerLoading;

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
            Pool, 매도인별 현황 및 상세정보를 확인할 수 있습니다.
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

      {/* View tabs (Pool별 / 매도인별) + Status tabs */}
      <div
        className="px-8 py-3 flex items-center gap-6"
        style={{ backgroundColor: "#F5F5F5", borderBottom: "1px solid #DEDEDE" }}
      >
        {/* View tabs */}
        <div className="flex gap-2">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setViewTab(tab.value as "pool" | "seller")}
              className="px-4 py-2 text-sm font-semibold transition-colors cursor-pointer"
              style={{
                borderRadius: "4px",
                backgroundColor: viewTab === tab.value ? "#2D2D2D" : "transparent",
                color: viewTab === tab.value ? "white" : "#464646",
                border: viewTab === tab.value ? "none" : "1px solid #DEDEDE",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span style={{ color: "#DEDEDE" }}>|</span>

        {/* Status tabs */}
        <div className="flex gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
                setSellerPage(1);
              }}
              className="px-4 py-2 text-sm font-medium transition-colors cursor-pointer"
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
      </div>

      {/* Filter bar */}
      <div className="px-8 py-3 flex flex-wrap gap-3 items-end" style={{ borderBottom: "1px solid #DEDEDE" }}>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#7D7D7D" }}>Pool명</label>
          <input
            type="text"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="border text-sm outline-none"
            style={{ borderColor: "#DEDEDE", borderRadius: "4px", padding: "6px 10px", width: "160px" }}
            placeholder="Pool명 검색"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#7D7D7D" }}>매도인명</label>
          <input
            type="text"
            value={filterSeller}
            onChange={(e) => setFilterSeller(e.target.value)}
            className="border text-sm outline-none"
            style={{ borderColor: "#DEDEDE", borderRadius: "4px", padding: "6px 10px", width: "160px" }}
            placeholder="매도인 검색"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#7D7D7D" }}>거래종결일</label>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={filterClosingFrom}
              onChange={(e) => setFilterClosingFrom(e.target.value)}
              className="border text-sm outline-none"
              style={{ borderColor: "#DEDEDE", borderRadius: "4px", padding: "6px 10px" }}
            />
            <span className="text-sm" style={{ color: "#7D7D7D" }}>~</span>
            <input
              type="date"
              value={filterClosingTo}
              onChange={(e) => setFilterClosingTo(e.target.value)}
              className="border text-sm outline-none"
              style={{ borderColor: "#DEDEDE", borderRadius: "4px", padding: "6px 10px" }}
            />
          </div>
        </div>
        <button
          onClick={resetFilters}
          className="text-sm font-medium px-3 py-1.5 border cursor-pointer"
          style={{ borderColor: "#DEDEDE", borderRadius: "4px", color: "#7D7D7D" }}
        >
          초기화
        </button>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div
              className="w-8 h-8 border-4 rounded-full animate-spin"
              style={{ borderColor: "#DEDEDE", borderTopColor: "#D04A02" }}
            />
          </div>
        ) : error && viewTab === "pool" ? (
          <div className="text-center py-16" style={{ color: "#E0301E" }}>
            {error}
          </div>
        ) : viewTab === "pool" ? (
          <PoolTable items={items} startIndex={(page - 1) * size} />
        ) : (
          <PoolTable
            items={sellerItems.map((s) => ({
              id: s.pool_id,
              name: s.pool_name,
              status: s.status as "active" | "closed" | "cancelled",
              collateral_large: s.collateral_large,
              collateral_small: s.collateral_small,
              cutoff_date: null,
              bid_date: s.bid_date,
              closing_date: s.closing_date,
              seller_name: [s.seller_name],
              buyer_name: s.buyer_name,
              opb: s.opb,
              sale_price: s.sale_price,
              sale_ratio: s.sale_ratio,
              remarks: null,
              can_view_detail: s.can_view_detail,
            }))}
            startIndex={(sellerPage - 1) * sellerSize}
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-8 py-4 flex justify-end gap-1">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="px-3 py-1.5 text-sm border"
            style={{
              borderColor: "#DEDEDE",
              borderRadius: "4px",
              color: currentPage <= 1 ? "#DEDEDE" : "#2D2D2D",
              cursor: currentPage <= 1 ? "not-allowed" : "pointer",
            }}
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className="px-3 py-1.5 text-sm border cursor-pointer"
              style={{
                borderRadius: "4px",
                backgroundColor: p === currentPage ? "#D04A02" : "white",
                color: p === currentPage ? "white" : "#2D2D2D",
                borderColor: p === currentPage ? "#D04A02" : "#DEDEDE",
              }}
            >
              {p}
            </button>
          ))}
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="px-3 py-1.5 text-sm border"
            style={{
              borderColor: "#DEDEDE",
              borderRadius: "4px",
              color: currentPage >= totalPages ? "#DEDEDE" : "#2D2D2D",
              cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
            }}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
