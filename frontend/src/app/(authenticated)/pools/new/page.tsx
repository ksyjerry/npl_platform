"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import RoleGuard from "@/components/auth/RoleGuard";

interface CompanyOption {
  id: number;
  name: string;
  type: string;
}

interface PoolCompanyEntry {
  company_id: number;
  advisor: string;
}

interface PoolForm {
  name: string;
  status: string;
  collateral_large: string;
  collateral_small: string;
  cutoff_date: string;
  bid_date: string;
  closing_date: string;
  sale_method: string;
  bidder_count: string;
  debtor_count: string;
  bond_count: string;
  avg_overdue_months: string;
  opb: string;
  sale_price: string;
  resale_included: string;
  resale_debtor_count: string;
  resale_bond_count: string;
  resale_opb: string;
  remarks: string;
}

const INITIAL: PoolForm = {
  name: "",
  status: "active",
  collateral_large: "",
  collateral_small: "",
  cutoff_date: "",
  bid_date: "",
  closing_date: "",
  sale_method: "",
  bidder_count: "",
  debtor_count: "",
  bond_count: "",
  avg_overdue_months: "",
  opb: "",
  sale_price: "",
  resale_included: "",
  resale_debtor_count: "",
  resale_bond_count: "",
  resale_opb: "",
  remarks: "",
};

const COLLATERAL_LARGE = ["담보", "무담보"];
const COLLATERAL_SMALL = ["Regular", "Special", "CCRS", "IRL", "일반무담보", "기타"];
const SALE_METHODS = ["공개입찰", "제한경쟁입찰", "수의계약"];

function SectionHeading({ title }: { title: string }) {
  return (
    <h3
      className="text-base font-bold pb-3 mb-5"
      style={{ color: "#2D2D2D", borderBottom: "2px solid #D04A02" }}
    >
      {title}
    </h3>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
      {children}
      {required && <span style={{ color: "#E0301E" }}> *</span>}
    </label>
  );
}

const inputStyle = {
  borderColor: "#DEDEDE",
  borderRadius: "4px",
  padding: "8px 12px",
  color: "#2D2D2D",
};

function PoolCreateContent() {
  const router = useRouter();
  const [form, setForm] = useState<PoolForm>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Company master data
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [sellerEntries, setSellerEntries] = useState<PoolCompanyEntry[]>([]);
  const [buyerEntries, setBuyerEntries] = useState<PoolCompanyEntry[]>([]);

  useEffect(() => {
    api.get("/admin/companies", { params: { size: 500 } })
      .then((res) => setCompanies(res.data.items))
      .catch(() => {});
  }, []);

  const sellerCompanies = companies.filter((c) => c.type === "seller");
  const buyerCompanies = companies.filter((c) => c.type === "buyer");

  const addSellerEntry = () => setSellerEntries((prev) => [...prev, { company_id: 0, advisor: "" }]);
  const addBuyerEntry = () => setBuyerEntries((prev) => [...prev, { company_id: 0, advisor: "" }]);
  const removeSellerEntry = (idx: number) => setSellerEntries((prev) => prev.filter((_, i) => i !== idx));
  const removeBuyerEntry = (idx: number) => setBuyerEntries((prev) => prev.filter((_, i) => i !== idx));
  const updateSellerEntry = (idx: number, field: keyof PoolCompanyEntry, value: string | number) =>
    setSellerEntries((prev) => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  const updateBuyerEntry = (idx: number, field: keyof PoolCompanyEntry, value: string | number) =>
    setBuyerEntries((prev) => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));

  const update = (field: keyof PoolForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Pool명은 필수입니다.");
      return;
    }

    setSubmitting(true);
    setError("");

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      status: form.status || "active",
    };
    if (form.collateral_large) payload.collateral_large = form.collateral_large;
    if (form.collateral_small) payload.collateral_small = form.collateral_small;
    if (form.cutoff_date) payload.cutoff_date = form.cutoff_date;
    if (form.bid_date) payload.bid_date = form.bid_date;
    if (form.closing_date) payload.closing_date = form.closing_date;
    if (form.sale_method) payload.sale_method = form.sale_method;
    if (form.bidder_count) payload.bidder_count = parseInt(form.bidder_count);
    if (form.debtor_count) payload.debtor_count = parseInt(form.debtor_count);
    if (form.bond_count) payload.bond_count = parseInt(form.bond_count);
    if (form.avg_overdue_months) payload.avg_overdue_months = parseFloat(form.avg_overdue_months);
    if (form.opb) payload.opb = parseInt(form.opb.replace(/,/g, ""));
    if (form.sale_price) payload.sale_price = parseInt(form.sale_price.replace(/,/g, ""));
    if (form.resale_included) payload.resale_included = form.resale_included === "Y";
    if (form.resale_debtor_count) payload.resale_debtor_count = parseInt(form.resale_debtor_count);
    if (form.resale_bond_count) payload.resale_bond_count = parseInt(form.resale_bond_count);
    if (form.resale_opb) payload.resale_opb = parseInt(form.resale_opb.replace(/,/g, ""));
    if (form.remarks) payload.remarks = form.remarks;

    const validSellers = sellerEntries.filter((e) => e.company_id > 0);
    const validBuyers = buyerEntries.filter((e) => e.company_id > 0);
    if (validSellers.length > 0) {
      payload.seller_companies = validSellers.map((e) => ({
        company_id: e.company_id,
        advisor: e.advisor || undefined,
      }));
    }
    if (validBuyers.length > 0) {
      payload.buyer_companies = validBuyers.map((e) => ({
        company_id: e.company_id,
        advisor: e.advisor || undefined,
      }));
    }

    try {
      const res = await api.post("/pools", payload);
      router.push(`/pools/${res.data.id}`);
    } catch {
      setError("Pool 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Header */}
      <div className="px-8 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #DEDEDE" }}>
        <div>
          <h2 className="text-xl font-bold" style={{ color: "#2D2D2D" }}>Pool 등록</h2>
          <p className="text-sm mt-1" style={{ color: "#7D7D7D" }}>새로운 Pool을 등록합니다.</p>
        </div>
        <Link
          href="/pools"
          className="px-4 py-2 text-sm font-semibold border transition-colors"
          style={{ borderColor: "#DEDEDE", borderRadius: "4px", color: "#464646" }}
        >
          목록으로
        </Link>
      </div>

      {error && (
        <div className="mx-8 mt-4 px-4 py-3 text-sm" style={{ backgroundColor: "#FEF2F2", color: "#DC2626", borderRadius: "4px", border: "1px solid #FECACA" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-8 py-8 max-w-4xl">
        {/* 거래 정보 */}
        <SectionHeading title="거래 정보" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-10">
          <div>
            <Label required>Pool명</Label>
            <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full border text-sm outline-none" style={inputStyle} placeholder="Pool명을 입력하세요" />
          </div>
          <div>
            <Label>상태</Label>
            <select value={form.status} onChange={(e) => update("status", e.target.value)} className="w-full border text-sm outline-none" style={inputStyle}>
              <option value="active">진행</option>
              <option value="closed">종결</option>
            </select>
          </div>
          <div>
            <Label>자산확정일</Label>
            <input type="date" value={form.cutoff_date} onChange={(e) => update("cutoff_date", e.target.value)} className="w-full border text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <Label>입찰기일</Label>
            <input type="date" value={form.bid_date} onChange={(e) => update("bid_date", e.target.value)} className="w-full border text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <Label>거래종결일</Label>
            <input type="date" value={form.closing_date} onChange={(e) => update("closing_date", e.target.value)} className="w-full border text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <Label>매각방식</Label>
            <select value={form.sale_method} onChange={(e) => update("sale_method", e.target.value)} className="w-full border text-sm outline-none" style={inputStyle}>
              <option value="">선택</option>
              {SALE_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <Label>입찰참여자수</Label>
            <input type="number" value={form.bidder_count} onChange={(e) => update("bidder_count", e.target.value)} className="w-full border text-sm outline-none" style={inputStyle} placeholder="0" />
          </div>
        </div>

        {/* 거래 참여자 */}
        <SectionHeading title="거래 참여자" />
        <div className="mb-10 space-y-6">
          {/* 양도인 (Sellers) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>양도인</Label>
              <button
                type="button"
                onClick={addSellerEntry}
                className="text-xs font-semibold px-3 py-1"
                style={{ color: "#D04A02", border: "1px solid #D04A02", borderRadius: "4px" }}
              >
                + 추가
              </button>
            </div>
            {sellerEntries.length === 0 && (
              <p className="text-sm" style={{ color: "#7D7D7D" }}>등록된 양도인이 없습니다. + 추가 버튼을 눌러 추가하세요.</p>
            )}
            {sellerEntries.map((entry, idx) => (
              <div key={idx} className="flex gap-3 items-start mb-3">
                <select
                  value={entry.company_id}
                  onChange={(e) => updateSellerEntry(idx, "company_id", Number(e.target.value))}
                  className="flex-1 border text-sm outline-none"
                  style={inputStyle}
                >
                  <option value={0}>회사 선택</option>
                  {sellerCompanies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={entry.advisor}
                  onChange={(e) => updateSellerEntry(idx, "advisor", e.target.value)}
                  className="flex-1 border text-sm outline-none"
                  style={inputStyle}
                  placeholder="자문사 (선택)"
                />
                <button
                  type="button"
                  onClick={() => removeSellerEntry(idx)}
                  className="text-sm px-2 py-2"
                  style={{ color: "#DC2626" }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>

          {/* 양수인 (Buyers) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>양수인</Label>
              <button
                type="button"
                onClick={addBuyerEntry}
                className="text-xs font-semibold px-3 py-1"
                style={{ color: "#D04A02", border: "1px solid #D04A02", borderRadius: "4px" }}
              >
                + 추가
              </button>
            </div>
            {buyerEntries.length === 0 && (
              <p className="text-sm" style={{ color: "#7D7D7D" }}>등록된 양수인이 없습니다. + 추가 버튼을 눌러 추가하세요.</p>
            )}
            {buyerEntries.map((entry, idx) => (
              <div key={idx} className="flex gap-3 items-start mb-3">
                <select
                  value={entry.company_id}
                  onChange={(e) => updateBuyerEntry(idx, "company_id", Number(e.target.value))}
                  className="flex-1 border text-sm outline-none"
                  style={inputStyle}
                >
                  <option value={0}>회사 선택</option>
                  {buyerCompanies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={entry.advisor}
                  onChange={(e) => updateBuyerEntry(idx, "advisor", e.target.value)}
                  className="flex-1 border text-sm outline-none"
                  style={inputStyle}
                  placeholder="자문사 (선택)"
                />
                <button
                  type="button"
                  onClick={() => removeBuyerEntry(idx)}
                  className="text-sm px-2 py-2"
                  style={{ color: "#DC2626" }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 담보 정보 */}
        <SectionHeading title="담보 정보" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-10">
          <div>
            <Label>담보유형(대)</Label>
            <select value={form.collateral_large} onChange={(e) => update("collateral_large", e.target.value)} className="w-full border text-sm outline-none" style={inputStyle}>
              <option value="">선택</option>
              {COLLATERAL_LARGE.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label>담보유형(소)</Label>
            <select value={form.collateral_small} onChange={(e) => update("collateral_small", e.target.value)} className="w-full border text-sm outline-none" style={inputStyle}>
              <option value="">선택</option>
              {COLLATERAL_SMALL.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* 채권 정보 */}
        <SectionHeading title="채권 정보" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-10">
          <div>
            <Label>차주수</Label>
            <input type="number" value={form.debtor_count} onChange={(e) => update("debtor_count", e.target.value)} className="w-full border text-sm outline-none" style={inputStyle} placeholder="0" />
          </div>
          <div>
            <Label>채권수</Label>
            <input type="number" value={form.bond_count} onChange={(e) => update("bond_count", e.target.value)} className="w-full border text-sm outline-none" style={inputStyle} placeholder="0" />
          </div>
          <div>
            <Label>평균연체기간(개월)</Label>
            <input type="number" step="0.1" value={form.avg_overdue_months} onChange={(e) => update("avg_overdue_months", e.target.value)} className="w-full border text-sm outline-none" style={inputStyle} placeholder="0" />
          </div>
          <div>
            <Label>OPB(원)</Label>
            <input type="text" value={form.opb} onChange={(e) => update("opb", e.target.value)} className="w-full border text-sm outline-none" style={inputStyle} placeholder="0" />
          </div>
        </div>

        {/* 가격 정보 */}
        <SectionHeading title="가격 정보" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-10">
          <div>
            <Label>양수도가격(원)</Label>
            <input type="text" value={form.sale_price} onChange={(e) => update("sale_price", e.target.value)} className="w-full border text-sm outline-none" style={inputStyle} placeholder="0" />
          </div>
          <div>
            <Label>매각가율(%)</Label>
            <div className="w-full border text-sm px-3 py-2" style={{ borderColor: "#DEDEDE", borderRadius: "4px", color: "#7D7D7D", backgroundColor: "#F5F5F5" }}>
              자동 계산
            </div>
          </div>
        </div>

        {/* 재매각 정보 */}
        <SectionHeading title="재매각 정보" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-10">
          <div>
            <Label>재매각채권 포함여부</Label>
            <select value={form.resale_included} onChange={(e) => update("resale_included", e.target.value)} className="w-full border text-sm outline-none" style={inputStyle}>
              <option value="">선택</option>
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </div>
          <div />
          {form.resale_included === "Y" && (
            <>
              <div>
                <Label>재매각 차주수</Label>
                <input type="number" value={form.resale_debtor_count} onChange={(e) => update("resale_debtor_count", e.target.value)} className="w-full border text-sm outline-none" style={inputStyle} placeholder="0" />
              </div>
              <div>
                <Label>재매각 채권수</Label>
                <input type="number" value={form.resale_bond_count} onChange={(e) => update("resale_bond_count", e.target.value)} className="w-full border text-sm outline-none" style={inputStyle} placeholder="0" />
              </div>
              <div>
                <Label>재매각 OPB(원)</Label>
                <input type="text" value={form.resale_opb} onChange={(e) => update("resale_opb", e.target.value)} className="w-full border text-sm outline-none" style={inputStyle} placeholder="0" />
              </div>
            </>
          )}
        </div>

        {/* 기타 */}
        <SectionHeading title="기타" />
        <div className="mb-10">
          <Label>비고</Label>
          <textarea value={form.remarks} onChange={(e) => update("remarks", e.target.value)} rows={4} className="w-full border text-sm outline-none resize-vertical" style={inputStyle} placeholder="비고 사항을 입력하세요" />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4" style={{ borderTop: "1px solid #DEDEDE" }}>
          <Link
            href="/pools"
            className="px-6 py-2.5 text-sm font-semibold border-2 transition-colors"
            style={{ borderColor: "#D04A02", color: "#D04A02", borderRadius: "4px" }}
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 text-sm font-semibold text-white transition-colors"
            style={{
              backgroundColor: submitting ? "rgba(208,74,2,0.4)" : "#D04A02",
              borderRadius: "4px",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "등록 중..." : "Pool 등록"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PoolCreatePage() {
  return (
    <RoleGuard permission="pool:write">
      <PoolCreateContent />
    </RoleGuard>
  );
}
