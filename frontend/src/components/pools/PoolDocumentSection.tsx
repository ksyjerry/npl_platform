"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import DocumentTable from "@/components/documents/DocumentTable";
import FileUploadZone from "@/components/documents/FileUploadZone";
import type { DocumentItem, DocumentListResponse } from "@/types/document";
import { getAccessToken, parseTokenPayload } from "@/lib/auth";

interface Props {
  poolId: number;
  canUpload: boolean;
}

const ROLE_TABS = [
  { value: "seller", label: "매도인 자료" },
  { value: "buyer", label: "매수인 자료" },
  { value: "accountant", label: "회계법인 자료" },
];

export default function PoolDocumentSection({ poolId, canUpload }: Props) {
  const [roleType, setRoleType] = useState("seller");
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const size = 20;

  const token = getAccessToken();
  const payload = token ? parseTokenPayload(token) : null;
  const currentUserId = payload?.sub ? Number(payload.sub) : undefined;
  const currentUserRole = (payload?.role as string) || "";

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<DocumentListResponse>("/documents", {
        params: { role_type: roleType, pool_id: poolId, page, size },
      });
      setItems(data.items);
      setTotal(data.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [poolId, roleType, page, size]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  return (
    <div className="space-y-4">
      {/* Role type tabs */}
      <div className="flex gap-2">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setRoleType(tab.value); setPage(1); }}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              borderRadius: "4px",
              backgroundColor: roleType === tab.value ? "#D04A02" : "white",
              color: roleType === tab.value ? "white" : "#2D2D2D",
              border: roleType === tab.value ? "none" : "1px solid #DEDEDE",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Upload zone */}
      {canUpload && (
        <FileUploadZone poolId={poolId} roleType={roleType} onUploaded={fetchDocs} />
      )}

      {/* Document table */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 rounded-full animate-spin" style={{ borderColor: "#DEDEDE", borderTopColor: "#D04A02" }} />
        </div>
      ) : (
        <DocumentTable
          items={items}
          startIndex={(page - 1) * size}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onRefresh={fetchDocs}
        />
      )}
    </div>
  );
}
