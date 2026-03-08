"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import RoleGuard from "@/components/auth/RoleGuard";
import AdminNav from "@/components/admin/AdminNav";

interface CompanyOption {
  id: number;
  name: string;
  type: string;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  is_verified: boolean;
  company_id: number;
  company_name?: string;
  created_at: string;
}

interface PaginatedResponse {
  items: AdminUser[];
  total: number;
  page: number;
  size: number;
}

const ROLE_OPTIONS = [
  { value: "", label: "전체" },
  { value: "admin", label: "관리자" },
  { value: "accountant", label: "회계법인" },
  { value: "seller", label: "매도인" },
  { value: "buyer", label: "매수인" },
  { value: "pending", label: "대기" },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "관리자",
  accountant: "회계법인",
  seller: "매도인",
  buyer: "매수인",
  pending: "대기",
};

const ROLE_BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  admin: { bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE" },
  accountant: { bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE" },
  seller: { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" },
  buyer: { bg: "#FAF5FF", text: "#6B21A8", border: "#E9D5FF" },
  pending: { bg: "#FEFCE8", text: "#A16207", border: "#FDE68A" },
};

const TYPE_LABELS: Record<string, string> = {
  seller: "매도인",
  buyer: "매수인",
  accountant: "회계법인",
};

const ASSIGNABLE_ROLES = [
  { value: "admin", label: "관리자" },
  { value: "accountant", label: "회계법인" },
  { value: "seller", label: "매도인" },
  { value: "buyer", label: "매수인" },
];

// AdminNav is imported from shared component

function UsersPageContent() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("");
  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  // Role change modal
  const [roleModal, setRoleModal] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState("");
  const [newCompanyId, setNewCompanyId] = useState<number | null>(null);
  const [roleReason, setRoleReason] = useState("");
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);

  // Password reset
  const [resetConfirm, setResetConfirm] = useState<AdminUser | null>(null);
  const [resetResult, setResetResult] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = { page, size: pageSize };
      if (filterRole) params.role = filterRole;
      const res = await api.get("/admin/users", { params });
      const data: PaginatedResponse = res.data;
      setUsers(data.items);
      setTotal(data.total);
    } catch {
      setError("회원 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [page, filterRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await api.get("/admin/companies", { params: { size: 500 } });
      setCompanies(res.data.items);
    } catch {
      /* ignore */
    }
  }, []);

  const handleRoleChange = async () => {
    if (!roleModal || !newRole || !roleReason.trim()) return;
    setRoleSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        role: newRole,
        is_verified: true,
        reason: roleReason,
      };
      if (newCompanyId !== null && newCompanyId !== roleModal.company_id) {
        payload.company_id = newCompanyId;
      }
      await api.patch(`/admin/users/${roleModal.id}`, payload);
      setRoleModal(null);
      setNewRole("");
      setNewCompanyId(null);
      setRoleReason("");
      await fetchUsers();
    } catch {
      setError("회원 정보 변경에 실패했습니다.");
    } finally {
      setRoleSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetConfirm) return;
    setResetting(true);
    try {
      const res = await api.post(`/admin/users/${resetConfirm.id}/reset-password`);
      setResetConfirm(null);
      setResetResult(res.data.temporary_password || res.data.temp_password || "임시 비밀번호가 발급되었습니다.");
    } catch {
      setError("비밀번호 초기화에 실패했습니다.");
      setResetConfirm(null);
    } finally {
      setResetting(false);
    }
  };

  const formatDate = (d: string) => d.slice(0, 10);

  return (
    <div>
      {/* Title + filter */}
      <div
        className="px-8 py-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid #DEDEDE" }}
      >
        <h2 className="text-xl font-bold" style={{ color: "#2D2D2D" }}>
          회원 관리
        </h2>
        <div className="flex items-center gap-3">
          <label className="text-sm" style={{ color: "#464646" }}>
            역할 필터:
          </label>
          <select
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              setPage(1);
            }}
            className="border text-sm outline-none"
            style={{
              borderColor: "#DEDEDE",
              borderRadius: "4px",
              padding: "6px 10px",
              color: "#2D2D2D",
            }}
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mx-8 mt-4 px-4 py-3 text-sm"
          style={{
            backgroundColor: "#FEF2F2",
            color: "#DC2626",
            borderRadius: "4px",
            border: "1px solid #FECACA",
          }}
        >
          {error}
          <button
            className="ml-4 underline"
            onClick={() => setError("")}
          >
            닫기
          </button>
        </div>
      )}

      {/* Table */}
      <div className="px-8 py-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div
              className="w-8 h-8 border-4 rounded-full animate-spin"
              style={{ borderColor: "#DEDEDE", borderTopColor: "#D04A02" }}
            />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: "#7D7D7D" }}>
            등록된 회원이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#2D2D2D" }}>
                  {["No", "이름", "회사명", "이메일", "역할", "인증상태", "가입일", "관리"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-semibold text-white"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const badge = ROLE_BADGE_COLORS[u.role] || ROLE_BADGE_COLORS.pending;
                  return (
                    <tr
                      key={u.id}
                      className="transition-colors"
                      style={{
                        backgroundColor: i % 2 === 1 ? "#FAFAFA" : "#FFFFFF",
                        borderBottom: "1px solid #DEDEDE",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#FFF5EE")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          i % 2 === 1 ? "#FAFAFA" : "#FFFFFF")
                      }
                    >
                      <td className="px-4 py-3">{(page - 1) * pageSize + i + 1}</td>
                      <td className="px-4 py-3" style={{ color: "#2D2D2D" }}>
                        {u.name}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#464646" }}>
                        {u.company_name || "-"}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#464646" }}>
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.text,
                            borderColor: badge.border,
                          }}
                        >
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_verified ? (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                            style={{
                              backgroundColor: "#F0FDF4",
                              color: "#166534",
                              borderColor: "#BBF7D0",
                            }}
                          >
                            인증
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                            style={{
                              backgroundColor: "#FFF7ED",
                              color: "#C2410C",
                              borderColor: "#FED7AA",
                            }}
                          >
                            미인증
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#464646" }}>
                        {formatDate(u.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setRoleModal(u);
                              setNewRole(u.role === "pending" ? "seller" : u.role);
                              setNewCompanyId(u.company_id || null);
                              fetchCompanies();
                            }}
                            className="text-sm hover:underline"
                            style={{ color: "#D04A02" }}
                          >
                            회원수정
                          </button>
                          <button
                            onClick={() => setResetConfirm(u)}
                            className="text-sm hover:underline"
                            style={{ color: "#D04A02" }}
                          >
                            비밀번호 초기화
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-end gap-2 mt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="px-3 py-1 text-sm border"
                style={{
                  borderColor: p === page ? "#D04A02" : "#DEDEDE",
                  color: p === page ? "#D04A02" : "#464646",
                  backgroundColor: p === page ? "#FFF5EE" : "transparent",
                  borderRadius: "4px",
                  fontWeight: p === page ? 600 : 400,
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      {roleModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setRoleModal(null);
              setNewRole("");
              setNewCompanyId(null);
              setRoleReason("");
            }
          }}
        >
          <div
            className="bg-white w-full max-w-[520px] mx-4"
            style={{
              borderRadius: "4px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
          >
            {/* Header */}
            <div
              className="px-6 pt-6 pb-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid #DEDEDE" }}
            >
              <h3 className="text-lg font-bold" style={{ color: "#2D2D2D" }}>
                회원 수정
              </h3>
              <button
                onClick={() => {
                  setRoleModal(null);
                  setNewRole("");
                  setNewCompanyId(null);
                  setRoleReason("");
                }}
                className="text-lg hover:opacity-70"
                style={{ color: "#7D7D7D" }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-sm mb-1" style={{ color: "#7D7D7D" }}>
                  대상 회원
                </p>
                <p className="text-sm font-semibold" style={{ color: "#2D2D2D" }}>
                  {roleModal.name} ({roleModal.email})
                </p>
              </div>
              <div>
                <label
                  className="block text-sm font-semibold mb-1"
                  style={{ color: "#2D2D2D" }}
                >
                  역할
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full border text-sm outline-none"
                  style={{
                    borderColor: "#DEDEDE",
                    borderRadius: "4px",
                    padding: "8px 10px",
                    color: "#2D2D2D",
                  }}
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-semibold mb-1"
                  style={{ color: "#2D2D2D" }}
                >
                  소속 회사
                </label>
                <select
                  value={newCompanyId ?? ""}
                  onChange={(e) => setNewCompanyId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full border text-sm outline-none"
                  style={{
                    borderColor: "#DEDEDE",
                    borderRadius: "4px",
                    padding: "8px 10px",
                    color: "#2D2D2D",
                  }}
                >
                  <option value="">없음</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({TYPE_LABELS[c.type] || c.type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-semibold mb-1"
                  style={{ color: "#2D2D2D" }}
                >
                  변경 사유
                </label>
                <textarea
                  value={roleReason}
                  onChange={(e) => setRoleReason(e.target.value)}
                  placeholder="변경 사유를 입력해주세요. (필수)"
                  className="w-full border text-sm outline-none resize-none"
                  rows={3}
                  style={{
                    borderColor: "#DEDEDE",
                    borderRadius: "4px",
                    padding: "10px 14px",
                    color: "#2D2D2D",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#D04A02";
                    e.target.style.boxShadow = "0 0 0 2px rgba(208,74,2,0.2)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#DEDEDE";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-6 pb-6 pt-4 flex justify-end gap-3"
              style={{ borderTop: "1px solid #DEDEDE" }}
            >
              <button
                onClick={() => {
                  setRoleModal(null);
                  setNewRole("");
                  setNewCompanyId(null);
                  setRoleReason("");
                }}
                className="px-4 py-2 text-sm font-semibold border-2 transition-colors"
                style={{
                  borderColor: "#D04A02",
                  color: "#D04A02",
                  borderRadius: "4px",
                }}
              >
                취소
              </button>
              <button
                disabled={!roleReason.trim() || roleSubmitting}
                onClick={handleRoleChange}
                className="px-4 py-2 text-sm font-semibold text-white transition-colors"
                style={{
                  backgroundColor:
                    roleReason.trim() && !roleSubmitting
                      ? "#D04A02"
                      : "rgba(208,74,2,0.4)",
                  borderRadius: "4px",
                  cursor:
                    roleReason.trim() && !roleSubmitting
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                {roleSubmitting ? "처리 중..." : "변경"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Confirm Modal */}
      {resetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setResetConfirm(null);
          }}
        >
          <div
            className="bg-white w-full max-w-[420px] mx-4"
            style={{
              borderRadius: "4px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
          >
            <div
              className="px-6 pt-6 pb-4"
              style={{ borderBottom: "1px solid #DEDEDE" }}
            >
              <h3 className="text-lg font-bold" style={{ color: "#2D2D2D" }}>
                비밀번호 초기화
              </h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm" style={{ color: "#464646" }}>
                <strong>{resetConfirm.name}</strong> ({resetConfirm.email})
                님의 비밀번호를 초기화하시겠습니까?
              </p>
              <p className="text-sm mt-2" style={{ color: "#7D7D7D" }}>
                임시 비밀번호가 발급됩니다.
              </p>
            </div>
            <div
              className="px-6 pb-6 pt-4 flex justify-end gap-3"
              style={{ borderTop: "1px solid #DEDEDE" }}
            >
              <button
                onClick={() => setResetConfirm(null)}
                className="px-4 py-2 text-sm font-semibold border-2 transition-colors"
                style={{
                  borderColor: "#D04A02",
                  color: "#D04A02",
                  borderRadius: "4px",
                }}
              >
                취소
              </button>
              <button
                disabled={resetting}
                onClick={handlePasswordReset}
                className="px-4 py-2 text-sm font-semibold text-white transition-colors"
                style={{
                  backgroundColor: resetting
                    ? "rgba(208,74,2,0.4)"
                    : "#D04A02",
                  borderRadius: "4px",
                  cursor: resetting ? "not-allowed" : "pointer",
                }}
              >
                {resetting ? "처리 중..." : "초기화"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Result Modal */}
      {resetResult && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setResetResult(null);
          }}
        >
          <div
            className="bg-white w-full max-w-[420px] mx-4"
            style={{
              borderRadius: "4px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
          >
            <div
              className="px-6 pt-6 pb-4"
              style={{ borderBottom: "1px solid #DEDEDE" }}
            >
              <h3 className="text-lg font-bold" style={{ color: "#2D2D2D" }}>
                임시 비밀번호 발급 완료
              </h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm mb-3" style={{ color: "#464646" }}>
                임시 비밀번호:
              </p>
              <div
                className="px-4 py-3 text-center font-mono text-lg font-bold select-all"
                style={{
                  backgroundColor: "#F5F5F5",
                  borderRadius: "4px",
                  color: "#D04A02",
                  border: "1px solid #DEDEDE",
                }}
              >
                {resetResult}
              </div>
              <p className="text-xs mt-3" style={{ color: "#7D7D7D" }}>
                해당 비밀번호를 회원에게 전달해주세요.
              </p>
            </div>
            <div
              className="px-6 pb-6 pt-4 flex justify-end"
              style={{ borderTop: "1px solid #DEDEDE" }}
            >
              <button
                onClick={() => setResetResult(null)}
                className="px-6 py-2 text-sm font-semibold text-white transition-colors"
                style={{
                  backgroundColor: "#D04A02",
                  borderRadius: "4px",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#EB8C00")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#D04A02")
                }
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

export default function AdminUsersPage() {
  return (
    <RoleGuard permission="admin:access">
      <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
        <AdminNav />
        <UsersPageContent />
      </div>
    </RoleGuard>
  );
}
