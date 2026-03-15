"use client";

import { useState, useEffect } from "react";
import type { PoolDetail } from "@/types/pool";
import PoolStatusBadge from "./PoolStatusBadge";
import ReasonModal from "@/components/ui/ReasonModal";
import api from "@/lib/api";

interface CompanyOption {
  id: number;
  name: string;
  type: string;
}

interface CompanyEntry {
  company_id: number;
  advisor: string;
}

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

const inputStyle = {
  borderColor: "#DEDEDE",
  borderRadius: "4px",
  padding: "8px 12px",
  color: "#2D2D2D",
};

const COLLATERAL_LARGE = ["담보", "무담보"];
const COLLATERAL_SMALL = ["Regular", "Special", "CCRS", "IRL", "일반무담보", "기타"];
const DEBTOR_TYPES = ["개인", "개인사업자", "법인"];
const SALE_METHODS = ["공개입찰", "제한경쟁입찰", "수의계약"];

interface EditForm {
  name: string;
  status: string;
  cutoff_date: string;
  bid_date: string;
  closing_date: string;
  sale_method: string;
  bidder_count: string;
  collateral_large: string[];
  collateral_small: string[];
  debtor_type: string[];
  debtor_count: string;
  bond_count: string;
  opb: string;
  sale_price: string;
  resale_included: string;
  resale_debtor_count: string;
  resale_bond_count: string;
  resale_opb: string;
  remarks: string;
}

function poolToEditForm(pool: PoolDetail): EditForm {
  return {
    name: pool.name || "",
    status: pool.status || "active",
    cutoff_date: pool.cutoff_date || "",
    bid_date: pool.bid_date || "",
    closing_date: pool.closing_date || "",
    sale_method: pool.sale_method || "",
    bidder_count: pool.bidder_count != null ? String(pool.bidder_count) : "",
    collateral_large: pool.collateral_large || [],
    collateral_small: pool.collateral_small || [],
    debtor_type: pool.debtor_type || [],
    debtor_count: pool.debtor_count != null ? String(pool.debtor_count) : "",
    bond_count: pool.bond_count != null ? String(pool.bond_count) : "",
    opb: pool.opb != null ? String(pool.opb) : "",
    sale_price: pool.sale_price != null ? String(pool.sale_price) : "",
    resale_included: pool.resale_included ? "Y" : pool.resale_included === false ? "N" : "",
    resale_debtor_count: pool.resale_debtor_count != null ? String(pool.resale_debtor_count) : "",
    resale_bond_count: pool.resale_bond_count != null ? String(pool.resale_bond_count) : "",
    resale_opb: pool.resale_opb != null ? String(pool.resale_opb) : "",
    remarks: pool.remarks || "",
  };
}

function EditInput({ value, onChange, type = "text", placeholder }: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border text-sm outline-none"
      style={inputStyle}
      placeholder={placeholder}
    />
  );
}

function EditSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border text-sm outline-none"
      style={inputStyle}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function EditFieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold" style={{ color: "#2D2D2D" }}>{label}</span>
      {children}
    </div>
  );
}

export default function PoolDetailForm({ pool, canEdit, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm>(poolToEditForm(pool));
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [syncResult, setSyncResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.post(`/pools/${pool.id}/sync-bonds`);
      setSyncResult({ type: "success", message: "채권 데이터 기준으로 동기화가 완료되었습니다.\n\n차주구분, 차주수, 채권수, OPB, 재매각 정보가 업데이트되었습니다." });
      onUpdated();
    } catch {
      setSyncResult({ type: "error", message: "동기화에 실패했습니다.\n\n채권 데이터가 Import되어 있는지 확인해주세요." });
    } finally {
      setSyncing(false);
    }
  };

  // Company master data
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [sellerEntries, setSellerEntries] = useState<CompanyEntry[]>([]);
  const [buyerEntries, setBuyerEntries] = useState<CompanyEntry[]>([]);

  useEffect(() => {
    if (editing && companies.length === 0) {
      api.get("/admin/companies", { params: { size: 500 } })
        .then((res) => setCompanies(res.data.items))
        .catch(() => {});
    }
  }, [editing, companies.length]);

  const sellerCompanyOptions = companies.filter((c) => c.type === "seller");
  const buyerCompanyOptions = companies.filter((c) => c.type === "buyer");

  const update = (field: keyof EditForm, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const startEdit = () => {
    setForm(poolToEditForm(pool));
    setSellerEntries(
      pool.seller_companies.map((c) => ({ company_id: c.company_id, advisor: c.advisor || "" }))
    );
    setBuyerEntries(
      pool.buyer_companies.map((c) => ({ company_id: c.company_id, advisor: c.advisor || "" }))
    );
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm(poolToEditForm(pool));
  };

  const handleSave = () => {
    setShowReasonModal(true);
  };

  const handleUpdate = async (reason: string) => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { reason };

      if (form.name !== pool.name) payload.name = form.name;
      if (form.status !== pool.status) payload.status = form.status;
      if (form.cutoff_date !== (pool.cutoff_date || "")) payload.cutoff_date = form.cutoff_date || null;
      if (form.bid_date !== (pool.bid_date || "")) payload.bid_date = form.bid_date || null;
      if (form.closing_date !== (pool.closing_date || "")) payload.closing_date = form.closing_date || null;
      if (form.sale_method !== (pool.sale_method || "")) payload.sale_method = form.sale_method || null;
      if (form.bidder_count !== (pool.bidder_count != null ? String(pool.bidder_count) : ""))
        payload.bidder_count = form.bidder_count ? parseInt(form.bidder_count) : null;
      if (JSON.stringify(form.collateral_large) !== JSON.stringify(pool.collateral_large || []))
        payload.collateral_large = form.collateral_large.length > 0 ? form.collateral_large : null;
      if (JSON.stringify(form.collateral_small) !== JSON.stringify(pool.collateral_small || []))
        payload.collateral_small = form.collateral_small.length > 0 ? form.collateral_small : null;
      if (JSON.stringify(form.debtor_type) !== JSON.stringify(pool.debtor_type || []))
        payload.debtor_type = form.debtor_type.length > 0 ? form.debtor_type : null;
      if (form.debtor_count !== (pool.debtor_count != null ? String(pool.debtor_count) : ""))
        payload.debtor_count = form.debtor_count ? parseInt(form.debtor_count) : null;
      if (form.bond_count !== (pool.bond_count != null ? String(pool.bond_count) : ""))
        payload.bond_count = form.bond_count ? parseInt(form.bond_count) : null;
      if (form.opb !== (pool.opb != null ? String(pool.opb) : ""))
        payload.opb = form.opb ? parseInt(form.opb.replace(/,/g, "")) : null;
      if (form.sale_price !== (pool.sale_price != null ? String(pool.sale_price) : ""))
        payload.sale_price = form.sale_price ? parseInt(form.sale_price.replace(/,/g, "")) : null;
      const origResale = pool.resale_included ? "Y" : pool.resale_included === false ? "N" : "";
      if (form.resale_included !== origResale)
        payload.resale_included = form.resale_included === "Y" ? true : form.resale_included === "N" ? false : null;
      if (form.resale_debtor_count !== (pool.resale_debtor_count != null ? String(pool.resale_debtor_count) : ""))
        payload.resale_debtor_count = form.resale_debtor_count ? parseInt(form.resale_debtor_count) : null;
      if (form.resale_bond_count !== (pool.resale_bond_count != null ? String(pool.resale_bond_count) : ""))
        payload.resale_bond_count = form.resale_bond_count ? parseInt(form.resale_bond_count) : null;
      if (form.resale_opb !== (pool.resale_opb != null ? String(pool.resale_opb) : ""))
        payload.resale_opb = form.resale_opb ? parseInt(form.resale_opb.replace(/,/g, "")) : null;
      if (form.remarks !== (pool.remarks || "")) payload.remarks = form.remarks || null;

      // Company entries
      const validSellers = sellerEntries.filter((e) => e.company_id > 0);
      const validBuyers = buyerEntries.filter((e) => e.company_id > 0);
      payload.seller_companies = validSellers.map((e) => ({
        company_id: e.company_id,
        advisor: e.advisor || undefined,
      }));
      payload.buyer_companies = validBuyers.map((e) => ({
        company_id: e.company_id,
        advisor: e.advisor || undefined,
      }));

      await api.patch(`/pools/${pool.id}`, payload);
      setShowReasonModal(false);
      setEditing(false);
      onUpdated();
    } catch {
      alert("수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // ── View Mode ──
  if (!editing) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold" style={{ color: "#2D2D2D" }}>{pool.name}</h2>
            <PoolStatusBadge status={pool.status} />
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-2 text-sm font-semibold transition-colors"
                style={{
                  border: "1px solid #D04A02",
                  color: syncing ? "#DEDEDE" : "#D04A02",
                  borderRadius: "4px",
                  cursor: syncing ? "not-allowed" : "pointer",
                }}
                title="채권 Import 데이터 기준으로 채권정보/재매각정보 자동 동기화"
              >
                {syncing ? "동기화 중..." : "채권정보 동기화"}
              </button>
              <button
                onClick={startEdit}
                className="px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
                style={{ backgroundColor: "#D04A02", borderRadius: "4px" }}
              >
                수정
              </button>
            </div>
          )}
        </div>

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

        <div>
          <SectionHeading title="거래 참여자 정보" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="매도인" value={pool.seller_companies.length > 0 ? pool.seller_companies.map((c) => c.name).join(", ") : "—"} italic />
            <FieldRow label="매도인 자문사" value={pool.seller_companies.length > 0 && pool.seller_companies[0].advisor ? pool.seller_companies[0].advisor : "—"} />
            <FieldRow label="매수인" value={pool.buyer_companies.length > 0 ? pool.buyer_companies.map((c) => c.name).join(", ") : "—"} italic />
            <FieldRow label="매수인 자문사" value={pool.buyer_companies.length > 0 && pool.buyer_companies[0].advisor ? pool.buyer_companies[0].advisor : "—"} />
          </div>
        </div>

        <div>
          <SectionHeading title="담보 정보" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="담보유형(대)" value={pool.collateral_large ? pool.collateral_large.join(", ") : "—"} italic />
            <FieldRow label="담보유형(소)" value={pool.collateral_small ? pool.collateral_small.join(", ") : "—"} italic />
          </div>
        </div>

        <div>
          <SectionHeading title="채권 정보" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="차주 구분" value={pool.debtor_type ? pool.debtor_type.join(", ") : "—"} />
            <FieldRow label="OPB(원)" value={formatNumber(pool.opb)} />
            <FieldRow label="차주 수" value={masked(pool.debtor_count)} />
            <FieldRow label="채권 수" value={masked(pool.bond_count)} />
          </div>
        </div>

        <div>
          <SectionHeading title="가격 정보" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="양수도가격(원)" value={formatNumber(pool.sale_price)} />
            <FieldRow label="매각가율(%)" value={formatRatio(pool.sale_ratio)} />
          </div>
        </div>

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

        <div>
          <SectionHeading title="기타" />
          <div>
            <FieldRow label="비고" value={masked(pool.remarks)} />
          </div>
        </div>

        {toast && (
          <div
            className="fixed bottom-6 right-6 z-[60] bg-white"
            style={{
              maxWidth: "360px",
              width: "100%",
              borderRadius: "4px",
              padding: "16px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              borderLeft: `4px solid ${toast.type === "success" ? "#166534" : "#E0301E"}`,
            }}
          >
            <p className="text-sm" style={{ color: "#2D2D2D" }}>{toast.message}</p>
          </div>
        )}
      </div>
    );
  }

  // ── Edit Mode ──
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold" style={{ color: "#2D2D2D" }}>Pool 수정</h2>
          <PoolStatusBadge status={pool.status} />
        </div>
        <div className="flex gap-3">
          <button
            onClick={cancelEdit}
            className="px-4 py-2 text-sm font-semibold border-2 transition-colors cursor-pointer"
            style={{ borderColor: "#D04A02", color: "#D04A02", borderRadius: "4px" }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
            style={{ backgroundColor: "#D04A02", borderRadius: "4px" }}
          >
            저장
          </button>
        </div>
      </div>

      {/* 거래 정보 */}
      <div>
        <SectionHeading title="거래 정보" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          <EditFieldRow label="Pool명">
            <EditInput value={form.name} onChange={(v) => update("name", v)} />
          </EditFieldRow>
          <EditFieldRow label="상태">
            <EditSelect value={form.status} onChange={(v) => update("status", v)} options={[
              { value: "active", label: "진행" },
              { value: "closed", label: "종결" },
              { value: "cancelled", label: "취소" },
            ]} />
          </EditFieldRow>
          <EditFieldRow label="자산확정일">
            <EditInput type="date" value={form.cutoff_date} onChange={(v) => update("cutoff_date", v)} />
          </EditFieldRow>
          <EditFieldRow label="입찰기일">
            <EditInput type="date" value={form.bid_date} onChange={(v) => update("bid_date", v)} />
          </EditFieldRow>
          <EditFieldRow label="거래종결일">
            <EditInput type="date" value={form.closing_date} onChange={(v) => update("closing_date", v)} />
          </EditFieldRow>
          <EditFieldRow label="매각방식">
            <EditSelect value={form.sale_method} onChange={(v) => update("sale_method", v)} options={[
              { value: "", label: "선택" },
              ...SALE_METHODS.map((m) => ({ value: m, label: m })),
            ]} />
          </EditFieldRow>
          <EditFieldRow label="입찰참여자수">
            <EditInput type="number" value={form.bidder_count} onChange={(v) => update("bidder_count", v)} placeholder="0" />
            <p className="text-xs mt-1" style={{ color: "#7D7D7D" }}>(참고) 입찰기일 이후 회계법인 수기 기재</p>
          </EditFieldRow>
        </div>
      </div>

      {/* 거래 참여자 */}
      <div>
        <SectionHeading title="거래 참여자 정보" />
        <div className="space-y-6">
          {/* 매도인 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: "#2D2D2D" }}>매도인</span>
              <button
                type="button"
                onClick={() => setSellerEntries((prev) => [...prev, { company_id: 0, advisor: "" }])}
                className="text-xs font-semibold px-3 py-1 cursor-pointer"
                style={{ color: "#D04A02", border: "1px solid #D04A02", borderRadius: "4px" }}
              >
                + 추가
              </button>
            </div>
            {sellerEntries.length === 0 && (
              <p className="text-sm" style={{ color: "#7D7D7D" }}>등록된 매도인이 없습니다.</p>
            )}
            {sellerEntries.map((entry, idx) => (
              <div key={idx} className="flex gap-3 items-start mb-3">
                <select
                  value={entry.company_id}
                  onChange={(e) => setSellerEntries((prev) => prev.map((en, i) => i === idx ? { ...en, company_id: Number(e.target.value) } : en))}
                  className="flex-1 border text-sm outline-none"
                  style={inputStyle}
                >
                  <option value={0}>회사 선택</option>
                  {sellerCompanyOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={entry.advisor}
                  onChange={(e) => setSellerEntries((prev) => prev.map((en, i) => i === idx ? { ...en, advisor: e.target.value } : en))}
                  className="flex-1 border text-sm outline-none"
                  style={inputStyle}
                  placeholder="자문사 (선택)"
                />
                <button
                  type="button"
                  onClick={() => setSellerEntries((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-sm px-2 py-2 cursor-pointer"
                  style={{ color: "#DC2626" }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>

          {/* 매수인 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: "#2D2D2D" }}>매수인</span>
              <button
                type="button"
                onClick={() => setBuyerEntries((prev) => [...prev, { company_id: 0, advisor: "" }])}
                className="text-xs font-semibold px-3 py-1 cursor-pointer"
                style={{ color: "#D04A02", border: "1px solid #D04A02", borderRadius: "4px" }}
              >
                + 추가
              </button>
            </div>
            {buyerEntries.length === 0 && (
              <p className="text-sm" style={{ color: "#7D7D7D" }}>등록된 매수인이 없습니다.</p>
            )}
            {buyerEntries.map((entry, idx) => (
              <div key={idx} className="flex gap-3 items-start mb-3">
                <select
                  value={entry.company_id}
                  onChange={(e) => setBuyerEntries((prev) => prev.map((en, i) => i === idx ? { ...en, company_id: Number(e.target.value) } : en))}
                  className="flex-1 border text-sm outline-none"
                  style={inputStyle}
                >
                  <option value={0}>회사 선택</option>
                  {buyerCompanyOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={entry.advisor}
                  onChange={(e) => setBuyerEntries((prev) => prev.map((en, i) => i === idx ? { ...en, advisor: e.target.value } : en))}
                  className="flex-1 border text-sm outline-none"
                  style={inputStyle}
                  placeholder="자문사 (선택)"
                />
                <button
                  type="button"
                  onClick={() => setBuyerEntries((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-sm px-2 py-2 cursor-pointer"
                  style={{ color: "#DC2626" }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 담보 정보 (CR-12: checkbox) */}
      <div>
        <SectionHeading title="담보 정보" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          <EditFieldRow label="담보유형(대)">
            <div className="flex gap-4 flex-wrap">
              {COLLATERAL_LARGE.map((c) => (
                <label key={c} className="flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: "#2D2D2D" }}>
                  <input
                    type="checkbox"
                    checked={form.collateral_large.includes(c)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...form.collateral_large, c]
                        : form.collateral_large.filter((v) => v !== c);
                      setForm((prev) => ({ ...prev, collateral_large: next }));
                    }}
                    style={{ accentColor: "#D04A02" }}
                  />
                  {c}
                </label>
              ))}
            </div>
          </EditFieldRow>
          <EditFieldRow label="담보유형(소)">
            <div className="flex gap-4 flex-wrap">
              {COLLATERAL_SMALL.map((c) => (
                <label key={c} className="flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: "#2D2D2D" }}>
                  <input
                    type="checkbox"
                    checked={form.collateral_small.includes(c)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...form.collateral_small, c]
                        : form.collateral_small.filter((v) => v !== c);
                      setForm((prev) => ({ ...prev, collateral_small: next }));
                    }}
                    style={{ accentColor: "#D04A02" }}
                  />
                  {c}
                </label>
              ))}
            </div>
          </EditFieldRow>
        </div>
      </div>

      {/* 채권 정보 */}
      <div>
        <SectionHeading title="채권 정보" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          <div className="md:col-span-2">
            <EditFieldRow label="차주 구분">
              <div className="flex flex-wrap gap-4 mt-1">
                {DEBTOR_TYPES.map((d) => (
                  <label key={d} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#2D2D2D" }}>
                    <input
                      type="checkbox"
                      checked={form.debtor_type.includes(d)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...form.debtor_type, d]
                          : form.debtor_type.filter((v) => v !== d);
                        setForm((prev) => ({ ...prev, debtor_type: next }));
                      }}
                      className="w-4 h-4"
                      style={{ accentColor: "#D04A02" }}
                    />
                    {d}
                  </label>
                ))}
              </div>
            </EditFieldRow>
          </div>
          <EditFieldRow label="OPB(원)">
            <EditInput value={form.opb} onChange={(v) => update("opb", v)} placeholder="0" />
          </EditFieldRow>
          <div />
          <EditFieldRow label="차주 수">
            <EditInput type="number" value={form.debtor_count} onChange={(v) => update("debtor_count", v)} placeholder="0" />
          </EditFieldRow>
          <EditFieldRow label="채권 수">
            <EditInput type="number" value={form.bond_count} onChange={(v) => update("bond_count", v)} placeholder="0" />
          </EditFieldRow>
        </div>
      </div>

      {/* 가격 정보 */}
      <div>
        <SectionHeading title="가격 정보" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          <EditFieldRow label="양수도가격(원)">
            <EditInput value={form.sale_price} onChange={(v) => update("sale_price", v)} placeholder="0" />
            <p className="text-xs mt-1" style={{ color: "#7D7D7D" }}>(참고) 입찰기일 이후 회계법인 수기 기재</p>
          </EditFieldRow>
          <EditFieldRow label="매각가율(%)">
            <div className="w-full border text-sm px-3 py-2" style={{ borderColor: "#DEDEDE", borderRadius: "4px", color: "#7D7D7D", backgroundColor: "#F5F5F5" }}>
              자동 계산
            </div>
          </EditFieldRow>
        </div>
      </div>

      {/* 재매각 정보 */}
      <div>
        <SectionHeading title="재매각 정보" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          <EditFieldRow label="재매각채권 포함여부">
            <EditSelect value={form.resale_included} onChange={(v) => update("resale_included", v)} options={[
              { value: "", label: "선택" },
              { value: "Y", label: "Y" },
              { value: "N", label: "N" },
            ]} />
          </EditFieldRow>
          <div />
          {form.resale_included === "Y" && (
            <>
              <EditFieldRow label="재매각 차주수">
                <EditInput type="number" value={form.resale_debtor_count} onChange={(v) => update("resale_debtor_count", v)} placeholder="0" />
              </EditFieldRow>
              <EditFieldRow label="재매각 채권수">
                <EditInput type="number" value={form.resale_bond_count} onChange={(v) => update("resale_bond_count", v)} placeholder="0" />
              </EditFieldRow>
              <EditFieldRow label="재매각 OPB(원)">
                <EditInput value={form.resale_opb} onChange={(v) => update("resale_opb", v)} placeholder="0" />
              </EditFieldRow>
            </>
          )}
        </div>
      </div>

      {/* 기타 */}
      <div>
        <SectionHeading title="기타" />
        <EditFieldRow label="비고">
          <textarea
            value={form.remarks}
            onChange={(e) => update("remarks", e.target.value)}
            rows={4}
            className="w-full border text-sm outline-none resize-vertical"
            style={inputStyle}
            placeholder="비고 사항을 입력하세요"
          />
        </EditFieldRow>
      </div>

      {/* Bottom action */}
      <div className="flex justify-end gap-3 pt-4" style={{ borderTop: "1px solid #DEDEDE" }}>
        <button
          onClick={cancelEdit}
          className="px-6 py-2.5 text-sm font-semibold border-2 transition-colors cursor-pointer"
          style={{ borderColor: "#D04A02", color: "#D04A02", borderRadius: "4px" }}
        >
          취소
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
          style={{ backgroundColor: "#D04A02", borderRadius: "4px" }}
        >
          저장
        </button>
      </div>

      <ReasonModal
        isOpen={showReasonModal}
        onConfirm={handleUpdate}
        onCancel={() => setShowReasonModal(false)}
      />

      {/* 동기화 결과 팝업 */}
      {syncResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setSyncResult(null)}
        >
          <div
            className="bg-white w-full max-w-md shadow-xl p-6"
            style={{ borderRadius: "8px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              {syncResult.type === "success" ? (
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#E8F5E9" }}>
                  <svg className="w-5 h-5" fill="none" stroke="#2E7D32" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FFEBEE" }}>
                  <svg className="w-5 h-5" fill="none" stroke="#E0301E" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              <h3 className="text-lg font-bold" style={{ color: "#2D2D2D" }}>
                {syncResult.type === "success" ? "동기화 완료" : "동기화 실패"}
              </h3>
            </div>
            <p className="text-sm whitespace-pre-line mb-6" style={{ color: "#464646" }}>
              {syncResult.message}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setSyncResult(null)}
                className="px-6 py-2 text-sm font-semibold text-white cursor-pointer"
                style={{ backgroundColor: syncResult.type === "success" ? "#D04A02" : "#464646", borderRadius: "4px" }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
