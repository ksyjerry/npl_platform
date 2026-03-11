"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/lib/api";
import RoleGuard from "@/components/auth/RoleGuard";
import AdminNav from "@/components/admin/AdminNav";
import ReasonModal from "@/components/ui/ReasonModal";

interface PoolOption {
  id: number;
  name: string;
}

interface BondItem {
  id: number;
  pool_id: number;
  bond_no: string | null;
  debtor_type: string | null;
  debtor_id_masked: string | null;
  creditor: string | null;
  product_type: string | null;
  collateral_type: string | null;
  original_amount: number | null;
  opb: number | null;
  total_balance: number | null;
  overdue_months: number | null;
  legal_status: string | null;
}

interface ImportResult {
  file_name: string;
  row_count: number;
  success_count: number;
  error_count: number;
}

function formatNum(n: number | null) {
  if (n === null) return "—";
  return n.toLocaleString("ko-KR");
}

function BondsContent() {
  const [pools, setPools] = useState<PoolOption[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState<string>("");
  const [bonds, setBonds] = useState<BondItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BondItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pageSize = 20;

  useEffect(() => {
    api.get("/pools", { params: { size: 200 } })
      .then((res) => setPools(res.data.items.map((p: PoolOption) => ({ id: p.id, name: p.name }))))
      .catch(() => {});
  }, []);

  const fetchBonds = useCallback(async () => {
    if (!selectedPoolId) return;
    setLoading(true);
    try {
      const { data } = await api.get("/bonds", {
        params: { pool_id: selectedPoolId, page, size: pageSize },
      });
      setBonds(data.items);
      setTotal(data.total);
    } catch {
      setBonds([]);
    } finally {
      setLoading(false);
    }
  }, [selectedPoolId, page]);

  useEffect(() => {
    if (selectedPoolId) fetchBonds();
  }, [selectedPoolId, fetchBonds]);

  const handleTemplateDownload = async () => {
    try {
      const response = await api.get("/bonds/template", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "bond_import_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("템플릿 다운로드에 실패했습니다.");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPoolId) return;

    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post(`/bonds/import?pool_id=${selectedPoolId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(data);
      fetchBonds();
    } catch {
      alert("엑셀 업로드에 실패했습니다.");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (reason: string) => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/bonds/${deleteTarget.id}`, { data: { reason } });
      setDeleteTarget(null);
      fetchBonds();
    } catch {
      alert("삭제 실패");
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="px-8 py-5" style={{ borderBottom: "1px solid #DEDEDE" }}>
        <h2 className="text-xl font-bold" style={{ color: "#2D2D2D" }}>채권 관리</h2>
        <p className="text-sm mt-1" style={{ color: "#7D7D7D" }}>Pool별 채권 데이터를 관리합니다.</p>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Pool selector */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: "#2D2D2D" }}>Pool 선택</label>
          <select
            value={selectedPoolId}
            onChange={(e) => { setSelectedPoolId(e.target.value); setPage(1); }}
            className="border text-sm w-full max-w-md outline-none"
            style={{ borderColor: "#DEDEDE", borderRadius: "4px", padding: "10px 14px", color: "#2D2D2D" }}
          >
            <option value="">Pool을 선택하세요</option>
            {pools.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {selectedPoolId && (
          <>
            {/* Excel Upload + Template Download */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleTemplateDownload}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold"
                style={{ border: "1px solid #DEDEDE", borderRadius: "4px", color: "#2D2D2D" }}
              >
                템플릿 다운로드
              </button>
              <label
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold cursor-pointer"
                style={{ border: "1px solid #D04A02", borderRadius: "4px", color: "#D04A02" }}
              >
                {importing ? "업로드 중..." : "엑셀 업로드"}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  className="hidden"
                  disabled={importing}
                />
              </label>
              {importResult && (
                <span className="text-sm" style={{ color: "#166534" }}>
                  {importResult.file_name}: {importResult.success_count}건 성공
                  {importResult.error_count > 0 && `, ${importResult.error_count}건 오류`}
                </span>
              )}
            </div>

            {/* Bonds table */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 rounded-full animate-spin" style={{ borderColor: "#DEDEDE", borderTopColor: "#D04A02" }} />
              </div>
            ) : bonds.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: "#7D7D7D" }}>등록된 채권이 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: "1200px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#2D2D2D" }}>
                      {["No", "채권번호", "차주구분", "차주ID", "채권자", "상품유형", "담보유형", "원금", "OPB", "합계잔액", "연체(월)", "법적상태", "액션"].map((h) => (
                        <th key={h} className="px-3 py-3 font-semibold text-white whitespace-nowrap text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bonds.map((bond, idx) => (
                      <tr
                        key={bond.id}
                        style={{ backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA", borderBottom: "1px solid #DEDEDE" }}
                      >
                        <td className="px-3 py-3">{(page - 1) * pageSize + idx + 1}</td>
                        <td className="px-3 py-3">{bond.bond_no || "—"}</td>
                        <td className="px-3 py-3">{bond.debtor_type || "—"}</td>
                        <td className="px-3 py-3">{bond.debtor_id_masked || "—"}</td>
                        <td className="px-3 py-3">{bond.creditor || "—"}</td>
                        <td className="px-3 py-3">{bond.product_type || "—"}</td>
                        <td className="px-3 py-3">{bond.collateral_type || "—"}</td>
                        <td className="px-3 py-3 text-right">{formatNum(bond.original_amount)}</td>
                        <td className="px-3 py-3 text-right">{formatNum(bond.opb)}</td>
                        <td className="px-3 py-3 text-right">{formatNum(bond.total_balance)}</td>
                        <td className="px-3 py-3">{bond.overdue_months ?? "—"}</td>
                        <td className="px-3 py-3">{bond.legal_status || "—"}</td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => setDeleteTarget(bond)}
                            className="text-xs hover:underline"
                            style={{ color: "#E0301E" }}
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-end gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="px-3 py-1.5 text-sm border"
                    style={{
                      borderRadius: "4px",
                      backgroundColor: p === page ? "#D04A02" : "white",
                      color: p === page ? "white" : "#2D2D2D",
                      borderColor: p === page ? "#D04A02" : "#DEDEDE",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {deleteTarget && (
        <ReasonModal
          isOpen
          title="채권 삭제"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

export default function AdminBondsPage() {
  return (
    <RoleGuard permission="admin:access">
      <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
        <AdminNav />
        <BondsContent />
      </div>
    </RoleGuard>
  );
}
