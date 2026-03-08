"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import type { DocumentItem, DocumentListResponse } from "@/types/document";

export function useDocuments(roleType: string) {
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [poolId, setPoolId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const size = 20;

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { role_type: roleType, page, size };
      if (poolId) params.pool_id = poolId;
      const { data } = await api.get<DocumentListResponse>("/documents", { params });
      setItems(data.items);
      setTotal(data.total);
    } catch (err: unknown) {
      const e = err as { response?: { status: number; data?: { detail?: string } } };
      if (e.response?.status === 403) {
        setError("접근 권한이 없습니다.");
      } else {
        setError("자료 목록을 불러오지 못했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [roleType, page, poolId, size]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return { items, total, page, setPage, poolId, setPoolId, loading, error, size, refresh: fetchDocuments };
}
