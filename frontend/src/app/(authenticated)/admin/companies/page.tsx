"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import RoleGuard from "@/components/auth/RoleGuard";
import AdminNav from "@/components/admin/AdminNav";

interface CompanyItem {
  id: number;
  name: string;
  type: string;
  user_count: number;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  seller: "매도인",
  buyer: "매수인",
  accountant: "회계법인",
};

const TYPE_OPTIONS = [
  { value: "", label: "전체" },
  { value: "seller", label: "매도인" },
  { value: "buyer", label: "매수인" },
  { value: "accountant", label: "회계법인" },
];

function CompaniesContent() {
  const [items, setItems] = useState<CompanyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [error, setError] = useState("");
  const pageSize = 50;
  const totalPages = Math.ceil(total / pageSize);

  // Modal state
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editItem, setEditItem] = useState<CompanyItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("seller");
  const [formReason, setFormReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<CompanyItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = { page, size: pageSize };
      if (filterType) params.type = filterType;
      const res = await api.get("/admin/companies", { params });
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      setError("회사 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [page, filterType]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => {
    setModal("create");
    setFormName("");
    setFormType("seller");
  };

  const openEdit = (item: CompanyItem) => {
    setModal("edit");
    setEditItem(item);
    setFormName(item.name);
    setFormType(item.type);
    setFormReason("");
  };

  const closeModal = () => {
    setModal(null);
    setEditItem(null);
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      await api.post("/admin/companies", { name: formName, type: formType });
      closeModal();
      await fetchItems();
    } catch {
      setError("회사 등록에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editItem || !formReason.trim()) return;
    setSaving(true);
    try {
      await api.patch(`/admin/companies/${editItem.id}`, {
        reason: formReason,
        name: formName,
        type: formType,
      });
      closeModal();
      await fetchItems();
    } catch {
      setError("회사 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/companies/${deleteTarget.id}`);
      setDeleteTarget(null);
      await fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.detail || "회사 삭제에 실패했습니다.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Title */}
      <div className="px-8 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid #DEDEDE" }}>
        <div>
          <h2 className="text-xl font-bold" style={{ color: "#2D2D2D" }}>회사 관리</h2>
          <p className="text-sm mt-1" style={{ color: "#7D7D7D" }}>고객 회사를 등록하고 관리합니다.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm font-semibold text-white transition-colors cursor-pointer"
          style={{ backgroundColor: "#D04A02", borderRadius: "4px" }}
        >
          + 회사 등록
        </button>
      </div>

      {/* Type filter */}
      <div className="px-8 pt-4 flex gap-4">
        {TYPE_OPTIONS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setFilterType(tab.value); setPage(1); }}
            className="px-4 py-2 text-sm font-semibold transition-colors border cursor-pointer"
            style={{
              borderColor: filterType === tab.value ? "#D04A02" : "#DEDEDE",
              color: filterType === tab.value ? "#D04A02" : "#464646",
              backgroundColor: filterType === tab.value ? "#FFF5EE" : "transparent",
              borderRadius: "4px",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mx-8 mt-4 px-4 py-3 text-sm" style={{ backgroundColor: "#FEF2F2", color: "#DC2626", borderRadius: "4px", border: "1px solid #FECACA" }}>
          {error}
          <button className="ml-4 underline cursor-pointer" onClick={() => setError("")}>닫기</button>
        </div>
      )}

      {/* Table */}
      <div className="px-8 py-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "#DEDEDE", borderTopColor: "#D04A02" }} />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: "#7D7D7D" }}>등록된 회사가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#2D2D2D" }}>
                  {["No", "회사명", "유형", "소속 회원수", "등록일", "관리"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-white">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr
                    key={item.id}
                    className="transition-colors"
                    style={{ backgroundColor: i % 2 === 1 ? "#FAFAFA" : "#FFFFFF", borderBottom: "1px solid #DEDEDE" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FFF5EE")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = i % 2 === 1 ? "#FAFAFA" : "#FFFFFF")}
                  >
                    <td className="px-4 py-3">{(page - 1) * pageSize + i + 1}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: "#2D2D2D" }}>{item.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{
                        backgroundColor: item.type === "accountant" ? "#EDE9FE" : item.type === "seller" ? "#DBEAFE" : "#FEF3C7",
                        color: item.type === "accountant" ? "#6D28D9" : item.type === "seller" ? "#1D4ED8" : "#92400E",
                      }}>
                        {TYPE_LABELS[item.type] || item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: "#464646" }}>{item.user_count}명</td>
                    <td className="px-4 py-3" style={{ color: "#464646" }}>{item.created_at?.slice(0, 10)}</td>
                    <td className="px-4 py-3 flex gap-3">
                      <button onClick={() => openEdit(item)} className="text-sm hover:underline cursor-pointer" style={{ color: "#D04A02" }}>수정</button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="text-sm hover:underline"
                        style={{ color: item.user_count > 0 ? "#DEDEDE" : "#DC2626", cursor: item.user_count > 0 ? "not-allowed" : "pointer" }}
                        disabled={item.user_count > 0}
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

        {totalPages > 1 && (
          <div className="flex justify-end gap-2 mt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className="px-3 py-1 text-sm border cursor-pointer" style={{
                borderColor: p === page ? "#D04A02" : "#DEDEDE",
                color: p === page ? "#D04A02" : "#464646",
                backgroundColor: p === page ? "#FFF5EE" : "transparent",
                borderRadius: "4px",
                fontWeight: p === page ? 600 : 400,
              }}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bg-white w-full max-w-[460px] mx-4" style={{ borderRadius: "4px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <div className="px-6 pt-6 pb-4 flex items-center justify-between" style={{ borderBottom: "1px solid #DEDEDE" }}>
              <h3 className="text-lg font-bold" style={{ color: "#2D2D2D" }}>
                {modal === "create" ? "회사 등록" : "회사 수정"}
              </h3>
              <button onClick={closeModal} className="text-lg hover:opacity-70 cursor-pointer" style={{ color: "#7D7D7D" }}>✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>회사명 <span style={{ color: "#E0301E" }}>*</span></label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full border text-sm outline-none" style={{ borderColor: "#DEDEDE", borderRadius: "4px", padding: "8px 12px", color: "#2D2D2D" }} placeholder="회사명을 입력하세요" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>유형 <span style={{ color: "#E0301E" }}>*</span></label>
                <select value={formType} onChange={(e) => setFormType(e.target.value)} className="w-full border text-sm outline-none" style={{ borderColor: "#DEDEDE", borderRadius: "4px", padding: "8px 12px", color: "#2D2D2D" }}>
                  <option value="seller">매도인</option>
                  <option value="buyer">매수인</option>
                  <option value="accountant">회계법인</option>
                </select>
              </div>
              {modal === "edit" && (
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>수정 사유 <span style={{ color: "#E0301E" }}>*</span></label>
                  <input type="text" value={formReason} onChange={(e) => setFormReason(e.target.value)} className="w-full border text-sm outline-none" style={{ borderColor: "#DEDEDE", borderRadius: "4px", padding: "8px 12px", color: "#2D2D2D" }} placeholder="수정 사유를 입력하세요" />
                </div>
              )}
            </div>
            <div className="px-6 pb-6 pt-4 flex justify-end gap-3" style={{ borderTop: "1px solid #DEDEDE" }}>
              <button onClick={closeModal} className="px-4 py-2 text-sm font-semibold border-2 transition-colors cursor-pointer" style={{ borderColor: "#D04A02", color: "#D04A02", borderRadius: "4px" }}>취소</button>
              <button
                onClick={modal === "create" ? handleCreate : handleUpdate}
                disabled={saving || !formName.trim() || (modal === "edit" && !formReason.trim())}
                className="px-4 py-2 text-sm font-semibold text-white transition-colors"
                style={{
                  backgroundColor: saving ? "rgba(208,74,2,0.4)" : "#D04A02",
                  borderRadius: "4px",
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "처리 중..." : modal === "create" ? "등록" : "수정"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white mx-4 p-6" style={{ maxWidth: "400px", borderRadius: "4px", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
            <h3 className="text-lg font-bold mb-3" style={{ color: "#2D2D2D" }}>회사 삭제</h3>
            <p className="text-sm mb-6" style={{ color: "#464646" }}>
              &quot;{deleteTarget.name}&quot;을(를) 삭제하시겠습니까?<br />이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-semibold border cursor-pointer" style={{ borderColor: "#DEDEDE", borderRadius: "4px", color: "#464646" }}>취소</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-white cursor-pointer"
                style={{ backgroundColor: deleting ? "#FCA5A5" : "#DC2626", borderRadius: "4px" }}
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCompaniesPage() {
  return (
    <RoleGuard permission="admin:access">
      <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
        <AdminNav />
        <CompaniesContent />
      </div>
    </RoleGuard>
  );
}
