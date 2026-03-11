"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import type { PoolDetail, PoolListItem, PoolListResponse } from "@/types/pool";

export interface PoolFilters {
  name?: string;
  seller_name?: string;
  cutoff_from?: string;
  cutoff_to?: string;
}

export function usePools(initialStatus?: string) {
  const [items, setItems] = useState<PoolListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>(initialStatus);
  const [filters, setFilters] = useState<PoolFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const size = 20;

  const fetchPools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, size };
      if (status) params.status = status;
      if (filters.name) params.name = filters.name;
      if (filters.seller_name) params.seller_name = filters.seller_name;
      if (filters.cutoff_from) params.cutoff_from = filters.cutoff_from;
      if (filters.cutoff_to) params.cutoff_to = filters.cutoff_to;
      const { data } = await api.get<PoolListResponse>("/pools", { params });
      setItems(data.items);
      setTotal(data.total);
    } catch {
      setError("Pool 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [page, status, filters, size]);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  return { items, total, page, setPage, status, setStatus, filters, setFilters, loading, error, size, refresh: fetchPools };
}

export function usePoolDetail(poolId: number) {
  const [pool, setPool] = useState<PoolDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPool = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<PoolDetail>(`/pools/${poolId}`);
      setPool(data);
    } catch (err: unknown) {
      const e = err as { response?: { status: number; data?: { detail?: string } } };
      if (e.response?.status === 403) {
        setError(e.response.data?.detail || "접근 권한이 없습니다.");
      } else if (e.response?.status === 404) {
        setError("Pool을 찾을 수 없습니다.");
      } else {
        setError("Pool 정보를 불러오지 못했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [poolId]);

  useEffect(() => {
    fetchPool();
  }, [fetchPool]);

  return { pool, loading, error, refresh: fetchPool };
}
