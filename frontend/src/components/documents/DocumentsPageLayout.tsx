"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDocuments } from "@/hooks/useDocuments";
import DocumentTable from "@/components/documents/DocumentTable";
import FileUploadZone from "@/components/documents/FileUploadZone";
import api from "@/lib/api";
import { getAccessToken, parseTokenPayload } from "@/lib/auth";

interface PoolOption {
  id: number;
  name: string;
}

interface Props {
  title: string;
  subtitle: string;
  roleType: string;
  canWrite: boolean;
  hideTitle?: boolean;
}

export default function DocumentsPageLayout({ title, subtitle, roleType, canWrite, hideTitle }: Props) {
  const { items, total, page, setPage, loading, error, size, refresh } = useDocuments(roleType);
  const [showUpload, setShowUpload] = useState(false);

  // Get current user info for DocumentTable actions
  const token = getAccessToken();
  const payload = token ? parseTokenPayload(token) : null;
  const currentUserId = payload?.sub ? Number(payload.sub) : undefined;
  const currentUserRole = (payload?.role as string) || "";

  // Pool name search state
  const [poolSearch, setPoolSearch] = useState("");
  const [poolOptions, setPoolOptions] = useState<PoolOption[]>([]);
  const [selectedPool, setSelectedPool] = useState<PoolOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(total / size);

  const [allPools, setAllPools] = useState<PoolOption[]>([]);

  // Fetch all pools once
  useEffect(() => {
    if (allPools.length > 0) return;
    setSearchLoading(true);
    api.get("/pools", { params: { page: 1, size: 200 } })
      .then(({ data }) => {
        setAllPools(data.items);
        setPoolOptions(data.items);
      })
      .catch(() => {})
      .finally(() => setSearchLoading(false));
  }, [allPools.length]);

  // Filter pools by search keyword
  useEffect(() => {
    if (selectedPool) return;
    if (!poolSearch.trim()) {
      setPoolOptions(allPools);
    } else {
      const q = poolSearch.toLowerCase();
      setPoolOptions(allPools.filter((p) => p.name.toLowerCase().includes(q)));
    }
  }, [poolSearch, allPools, selectedPool]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPool = (pool: PoolOption) => {
    setSelectedPool(pool);
    setPoolSearch(pool.name);
    setShowDropdown(false);
  };

  const handleClearPool = () => {
    setSelectedPool(null);
    setPoolSearch("");
    setPoolOptions([]);
  };

  return (
    <div style={{ backgroundColor: "#FFFFFF" }} className={hideTitle ? "" : "min-h-screen"}>
      {/* Title bar */}
      {!hideTitle && (
        <div className="px-8 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #DEDEDE" }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "#2D2D2D" }}>{title}</h2>
            <p className="text-sm mt-1" style={{ color: "#7D7D7D" }}>{subtitle}</p>
          </div>
          {canWrite && (
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
              style={{ backgroundColor: "#D04A02", borderRadius: "4px" }}
            >
              {showUpload ? "닫기" : "+ 자료 등록"}
            </button>
          )}
        </div>
      )}
      {hideTitle && canWrite && (
        <div className="px-8 pt-4 flex justify-end">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
            style={{ backgroundColor: "#D04A02", borderRadius: "4px" }}
          >
            {showUpload ? "닫기" : "+ 자료 등록"}
          </button>
        </div>
      )}

      {/* Upload zone */}
      {showUpload && canWrite && (
        <div className="px-8 py-4" style={{ backgroundColor: "#F5F5F5", borderBottom: "1px solid #DEDEDE" }}>
          <div className="max-w-xl">
            <div className="mb-3 relative" ref={dropdownRef}>
              <label className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                Pool 선택 <span style={{ color: "#E0301E" }}>*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pool명을 입력하여 검색하세요"
                  value={poolSearch}
                  onChange={(e) => {
                    setPoolSearch(e.target.value);
                    setSelectedPool(null);
                    setShowDropdown(true);
                  }}
                  onFocus={() => {
                    if (!selectedPool) setShowDropdown(true);
                  }}
                  className="w-full border text-sm outline-none"
                  style={{
                    borderColor: showDropdown ? "#D04A02" : "#DEDEDE",
                    borderRadius: "4px",
                    padding: "8px 36px 8px 12px",
                    color: "#2D2D2D",
                  }}
                />
                {selectedPool && (
                  <button
                    onClick={handleClearPool}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sm cursor-pointer"
                    style={{ color: "#7D7D7D" }}
                    title="선택 해제"
                  >
                    ✕
                  </button>
                )}
              </div>
              {/* Dropdown */}
              {showDropdown && !selectedPool && (
                <div
                  className="absolute z-10 left-0 right-0 mt-1 bg-white border max-h-48 overflow-y-auto"
                  style={{
                    borderColor: "#DEDEDE",
                    borderRadius: "4px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  {searchLoading ? (
                    <div className="px-4 py-3 text-sm" style={{ color: "#7D7D7D" }}>
                      검색 중...
                    </div>
                  ) : poolOptions.length === 0 ? (
                    <div className="px-4 py-3 text-sm" style={{ color: "#7D7D7D" }}>
                      일치하는 Pool이 없습니다.
                    </div>
                  ) : (
                    poolOptions.map((pool) => (
                      <button
                        key={pool.id}
                        onClick={() => handleSelectPool(pool)}
                        className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 flex items-center justify-between cursor-pointer"
                        style={{ color: "#2D2D2D" }}
                      >
                        <span>{pool.name}</span>
                        <span className="text-xs" style={{ color: "#7D7D7D" }}>ID: {pool.id}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {selectedPool && (
              <FileUploadZone
                poolId={selectedPool.id}
                roleType={roleType}
                onUploaded={() => {
                  setShowUpload(false);
                  handleClearPool();
                  refresh();
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-8 py-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "#DEDEDE", borderTopColor: "#D04A02" }} />
          </div>
        ) : error ? (
          <div className="text-center py-16" style={{ color: "#E0301E" }}>{error}</div>
        ) : (
          <DocumentTable
            items={items}
            startIndex={(page - 1) * size}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onRefresh={refresh}
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-8 py-4 flex justify-end gap-1">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 text-sm border" style={{ borderColor: "#DEDEDE", borderRadius: "4px", color: page <= 1 ? "#DEDEDE" : "#2D2D2D", cursor: page <= 1 ? "not-allowed" : "pointer" }}>이전</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className="px-3 py-1.5 text-sm border cursor-pointer" style={{ borderRadius: "4px", backgroundColor: p === page ? "#D04A02" : "white", color: p === page ? "white" : "#2D2D2D", borderColor: p === page ? "#D04A02" : "#DEDEDE" }}>{p}</button>
          ))}
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 text-sm border" style={{ borderColor: "#DEDEDE", borderRadius: "4px", color: page >= totalPages ? "#DEDEDE" : "#2D2D2D", cursor: page >= totalPages ? "not-allowed" : "pointer" }}>다음</button>
        </div>
      )}
    </div>
  );
}
