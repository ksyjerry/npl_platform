"use client";

import { useState } from "react";
import type { PoolDetail } from "@/types/pool";
import PoolStatusBadge from "./PoolStatusBadge";
import ReasonModal from "@/components/ui/ReasonModal";
import api from "@/lib/api";

function masked(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return String(value);
}

function formatNumber(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("ko-KR");
}

function formatRatio(value: number | null): string {
  if (value === null) return "—";
  return (value * 100).toFixed(2) + "%";
}

interface Props {
  pool: PoolDetail;
  canEdit: boolean;
  onUpdated: () => void;
}

interface FieldRowProps {
  label: string;
  value: string;
  italic?: boolean;
}

function FieldRow({ label, value, italic }: FieldRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold" style={{ color: "#2D2D2D" }}>
        {label}
      </span>
      <span
        className="text-sm"
        style={{
          color: value === "—" ? "#7D7D7D" : "#2D2D2D",
          fontStyle: value === "—" && italic ? "italic" : "normal",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h3
      className="text-base font-bold pb-3 mb-4"
      style={{ color: "#2D2D2D", borderBottom: "1px solid #DEDEDE" }}
    >
      {title}
    </h3>
  );
}

export default function PoolDetailForm({ pool, canEdit, onUpdated }: Props) {
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [editField, setEditField] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (reason: string) => {
    setSaving(true);
    try {
      await api.patch(`/pools/${pool.id}`, { reason, ...editField });
      setShowReasonModal(false);
      setEditField({});
      onUpdated();
    } catch {
      alert("수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Pool header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold" style={{ color: "#2D2D2D" }}>
            {pool.name}
          </h2>
          <PoolStatusBadge status={pool.status} />
        </div>
        {canEdit && (
          <button
            onClick={() => setShowReasonModal(true)}
            className="px-4 py-2 text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: "#D04A02", borderRadius: "4px" }}
          >
            수정
          </button>
        )}
      </div>

      {/* 거래 정보 */}
      <div>
        <SectionHeading title="거래 정보" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow label="자산확정일" value={masked(pool.cutoff_date)} />
          <FieldRow label="입찰기일" value={masked(pool.bid_date)} />
          <FieldRow label="거래종결일" value={masked(pool.closing_date)} />
          <FieldRow label="매각방식" value={masked(pool.sale_method)} />
          <FieldRow label="입찰참여자수" value={masked(pool.bidder_count)} />
        </div>
      </div>

      {/* 거래 참여자 */}
      <div>
        <SectionHeading title="거래 참여자 정보" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow
            label="양도인"
            value={pool.seller_companies.length > 0 ? pool.seller_companies.map((c) => c.name).join(", ") : "—"}
            italic
          />
          <FieldRow
            label="양도인 자문사"
            value={pool.seller_companies.length > 0 && pool.seller_companies[0].advisor ? pool.seller_companies[0].advisor : "—"}
          />
          <FieldRow
            label="양수인"
            value={pool.buyer_companies.length > 0 ? pool.buyer_companies.map((c) => c.name).join(", ") : "—"}
            italic
          />
          <FieldRow
            label="양수인 자문사"
            value={pool.buyer_companies.length > 0 && pool.buyer_companies[0].advisor ? pool.buyer_companies[0].advisor : "—"}
          />
        </div>
      </div>

      {/* 담보 정보 */}
      <div>
        <SectionHeading title="담보 정보" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow label="담보유형(대)" value={masked(pool.collateral_large)} italic />
          <FieldRow label="담보유형(소)" value={masked(pool.collateral_small)} italic />
        </div>
      </div>

      {/* 채권 정보 */}
      <div>
        <SectionHeading title="채권 정보" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow label="차주구분" value={pool.debtor_type ? pool.debtor_type.join(", ") : "—"} />
          <FieldRow label="차주수" value={masked(pool.debtor_count)} />
          <FieldRow label="채권수" value={masked(pool.bond_count)} />
          <FieldRow label="평균연체기간(개월)" value={masked(pool.avg_overdue_months)} />
          <FieldRow label="OPB(원)" value={formatNumber(pool.opb)} />
        </div>
      </div>

      {/* 가격 정보 */}
      <div>
        <SectionHeading title="가격 정보" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow label="양수도가격(원)" value={formatNumber(pool.sale_price)} />
          <FieldRow label="매각가율(%)" value={formatRatio(pool.sale_ratio)} />
        </div>
      </div>

      {/* 재매각 정보 */}
      <div>
        <SectionHeading title="재매각 정보" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow label="재매각채권 포함여부" value={pool.resale_included ? "Y" : "N"} />
          {pool.resale_included && (
            <>
              <FieldRow label="차주수(재매각분)" value={masked(pool.resale_debtor_count)} />
              <FieldRow label="채권수(재매각분)" value={masked(pool.resale_bond_count)} />
              <FieldRow label="OPB(재매각분)" value={formatNumber(pool.resale_opb ?? null)} />
            </>
          )}
        </div>
      </div>

      {/* 기타 */}
      <div>
        <SectionHeading title="기타" />
        <div>
          <FieldRow label="비고" value={masked(pool.remarks)} />
        </div>
      </div>

      <ReasonModal
        isOpen={showReasonModal}
        onConfirm={handleUpdate}
        onCancel={() => setShowReasonModal(false)}
      />
    </div>
  );
}
