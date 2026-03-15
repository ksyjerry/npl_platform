"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import DocumentTable from "@/components/documents/DocumentTable";
import FileUploadZone from "@/components/documents/FileUploadZone";
import type { DocumentItem, DocumentListResponse } from "@/types/document";
import { getAccessToken, parseTokenPayload } from "@/lib/auth";

interface Props {
  poolId: number;
  canUpload: boolean;
}

export default function PoolDocumentSection({ poolId, canUpload }: Props) {
  const roleType = "accountant";
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
