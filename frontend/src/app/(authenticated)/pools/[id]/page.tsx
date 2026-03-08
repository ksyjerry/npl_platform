"use client";

import { use } from "react";
import Link from "next/link";
import { usePoolDetail } from "@/hooks/usePools";
import PoolDetailForm from "@/components/pools/PoolDetailForm";
import { parseTokenPayload, getAccessToken } from "@/lib/auth";
import { can } from "@/lib/rbac";

export default function PoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const poolId = parseInt(id, 10);
  const { pool, loading, error, refresh } = usePoolDetail(poolId);

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

      {/* Detail form */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        <PoolDetailForm pool={pool} canEdit={canEdit} onUpdated={refresh} />
      </div>
    </div>
  );
}
