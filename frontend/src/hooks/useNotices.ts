"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import type { Notice, NoticeDetail, NoticeListResponse } from "@/types/notice";

export function useNotices(poolId?: number, initialPage = 1, size = 20) {
  const [items, setItems] = useState<Notice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(true);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, size };
      if (poolId) params.pool_id = poolId;
      const { data } = await api.get<NoticeListResponse>("/notices", { params });
      setItems(data.items);
      setTotal(data.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, size, poolId]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  return { items, total, page, setPage, loading, refetch: fetchNotices };
}

export function useNoticeDetail(noticeId: number) {
  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get<NoticeDetail>(`/notices/${noticeId}`);
        setNotice(data);
      } catch {
        setNotice(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [noticeId]);

  return { notice, loading };
}
