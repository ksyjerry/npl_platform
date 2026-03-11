"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import RoleGuard from "@/components/auth/RoleGuard";
import AdminNav from "@/components/admin/AdminNav";

interface PoolOption {
  id: number;
  name: string;
  status: string;
}

interface Participant {
  pool_id: number;
  company_id: number;
  company_name: string;
}

interface Company {
  id: number;
  name: string;
  type: string;
}

function PoolAccessContent() {
  const [pools, setPools] = useState<PoolOption[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState<number | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [addCompanyId, setAddCompanyId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/pools", { params: { size: 200 } })
      .then((res) => setPools(res.data.items))
      .catch(() => {});
    api.get("/admin/companies", { params: { size: 500 } })
      .then((res) => setCompanies(res.data.items))
      .catch(() => {});
  }, []);

  const fetchParticipants = useCallback(async () => {
    if (!selectedPoolId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/pools/${selectedPoolId}/participants`);
      setParticipants(data);
    } catch {
      setError("참여자 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [selectedPoolId]);

  useEffect(() => {
    if (selectedPoolId) fetchParticipants();
  }, [selectedPoolId, fetchParticipants]);

  const handleAdd = async () => {
    if (!selectedPoolId || !addCompanyId) return;
    try {
      await api.post(`/admin/pools/${selectedPoolId}/participants`, {
        company_id: Number(addCompanyId),
      });
      setAddCompanyId("");
      fetchParticipants();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "추가 실패");
    }
  };

  const handleRemove = async (companyId: number) => {
    if (!selectedPoolId) return;
    if (!confirm("이 업체의 접근 권한을 제거하시겠습니까?")) return;
    try {
      await api.delete(`/admin/pools/${selectedPoolId}/participants/${companyId}`);
      fetchParticipants();
    } catch {
      setError("제거 실패");
    }
  };

  const participantCompanyIds = new Set(participants.map((p) => p.company_id));
  const availableCompanies = companies.filter((c) => !participantCompanyIds.has(c.id));

  return (
    <div>
      <div className="px-8 py-5" style={{ borderBottom: "1px solid #DEDEDE" }}>
        <h2 className="text-xl font-bold" style={{ color: "#2D2D2D" }}>Pool 접근 관리</h2>
        <p className="text-sm mt-1" style={{ color: "#7D7D7D" }}>Pool별 참여 업체를 관리합니다.</p>
      </div>

      <div className="px-8 py-6">
        {/* Pool selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2" style={{ color: "#2D2D2D" }}>Pool 선택</label>
          <select
            value={selectedPoolId || ""}
            onChange={(e) => setSelectedPoolId(e.target.value ? Number(e.target.value) : null)}
            className="border text-sm w-full max-w-md outline-none"
            style={{ borderColor: "#DEDEDE", borderRadius: "4px", padding: "10px 14px", color: "#2D2D2D" }}
          >
            <option value="">Pool을 선택하세요</option>
            {pools.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 text-sm" style={{ backgroundColor: "#FEF2F2", color: "#DC2626", borderRadius: "4px" }}>
            {error}
            <button className="ml-4 underline" onClick={() => setError("")}>닫기</button>
          </div>
        )}

        {selectedPoolId && (
          <>
            {/* Add company */}
            <div className="flex gap-3 items-end mb-6">
              <div className="flex-1 max-w-md">
                <label className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>업체 추가</label>
                <select
                  value={addCompanyId}
                  onChange={(e) => setAddCompanyId(e.target.value)}
                  className="w-full border text-sm outline-none"
                  style={{ borderColor: "#DEDEDE", borderRadius: "4px", padding: "10px 14px", color: "#2D2D2D" }}
                >
                  <option value="">업체를 선택하세요</option>
                  {availableCompanies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAdd}
                disabled={!addCompanyId}
                className="px-4 py-2 text-sm font-semibold text-white"
                style={{
                  backgroundColor: addCompanyId ? "#D04A02" : "rgba(208,74,2,0.4)",
                  borderRadius: "4px",
                  cursor: addCompanyId ? "pointer" : "not-allowed",
                }}
              >
                추가
              </button>
            </div>

            {/* Participants table */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 rounded-full animate-spin" style={{ borderColor: "#DEDEDE", borderTopColor: "#D04A02" }} />
              </div>
            ) : participants.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: "#7D7D7D" }}>등록된 참여 업체가 없습니다.</p>
            ) : (
              <table className="w-full text-sm max-w-xl">
                <thead>
                  <tr style={{ backgroundColor: "#2D2D2D" }}>
                    <th className="px-4 py-3 text-left font-semibold text-white">업체명</th>
                    <th className="px-4 py-3 text-left font-semibold text-white">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p, idx) => (
                    <tr key={p.company_id} style={{ backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA", borderBottom: "1px solid #DEDEDE" }}>
                      <td className="px-4 py-3">{p.company_name}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRemove(p.company_id)}
                          className="text-xs hover:underline"
                          style={{ color: "#E0301E" }}
                        >
                          제거
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminPoolAccessPage() {
  return (
    <RoleGuard permission="admin:access">
      <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
        <AdminNav />
        <PoolAccessContent />
      </div>
    </RoleGuard>
  );
}
