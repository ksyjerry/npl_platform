"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import ReasonModal from "@/components/ui/ReasonModal";

interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: string;
  is_verified: boolean;
  company_name?: string;
  department?: string;
  title?: string;
  phone_office?: string;
  phone_mobile?: string;
  last_login_ip?: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "관리자",
  accountant: "회계법인",
  seller: "매도인",
  buyer: "매수인",
  pending: "대기",
};

export default function MyPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showReason, setShowReason] = useState(false);
  const [error, setError] = useState("");

  // Editable fields
  const [editName, setEditName] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editPhoneOffice, setEditPhoneOffice] = useState("");
  const [editPhoneMobile, setEditPhoneMobile] = useState("");

  const fetchUser = async () => {
    try {
      const res = await api.get("/users/me");
      setUser(res.data);
    } catch {
      setError("사용자 정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const startEdit = () => {
    if (!user) return;
    setEditName(user.name || "");
    setEditDepartment(user.department || "");
    setEditTitle(user.title || "");
    setEditPhoneOffice(user.phone_office || "");
    setEditPhoneMobile(user.phone_mobile || "");
    setEditing(true);
    setError("");
  };

  const cancelEdit = () => {
    setEditing(false);
    setError("");
  };

  const handleSave = async (reason: string) => {
    setShowReason(false);
    setSaving(true);
    setError("");
    try {
      await api.patch("/users/me", {
        reason,
        name: editName,
        department: editDepartment,
        title: editTitle,
        phone_office: editPhoneOffice,
        phone_mobile: editPhoneMobile,
      });
      setEditing(false);
      await fetchUser();
    } catch {
      setError("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm" style={{ color: "#7D7D7D" }}>
          {error || "사용자 정보를 불러올 수 없습니다."}
        </p>
      </div>
    );
  }

  const infoField = (
    label: string,
    value: string | undefined,
    editNode?: React.ReactNode
  ) => (
    <div className="flex flex-col gap-1">
      <span
        className="text-sm font-semibold"
        style={{ color: "#2D2D2D" }}
      >
        {label}
      </span>
      {editing && editNode ? (
        editNode
      ) : (
        <span className="text-sm" style={{ color: "#464646" }}>
          {value || "-"}
        </span>
      )}
    </div>
  );

  const inputStyle: React.CSSProperties = {
    borderColor: "#DEDEDE",
    borderRadius: "4px",
    padding: "6px 10px",
    color: "#2D2D2D",
    outline: "none",
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Title bar */}
      <div
        className="px-8 py-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid #DEDEDE" }}
      >
        <div>
          <h2 className="text-xl font-bold" style={{ color: "#2D2D2D" }}>
            마이페이지
          </h2>
          <p className="text-sm mt-1" style={{ color: "#7D7D7D" }}>
            내 계정 정보를 확인하고 수정할 수 있습니다.
          </p>
        </div>
        {!editing ? (
          <button
            onClick={startEdit}
            className="text-sm font-semibold text-white transition-colors"
            style={{
              backgroundColor: "#D04A02",
              borderRadius: "4px",
              padding: "8px 24px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#EB8C00")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#D04A02")
            }
          >
            수정
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={cancelEdit}
              className="text-sm font-semibold border-2 transition-colors"
              style={{
                borderColor: "#D04A02",
                color: "#D04A02",
                borderRadius: "4px",
                padding: "6px 20px",
              }}
            >
              취소
            </button>
            <button
              onClick={() => setShowReason(true)}
              disabled={saving}
              className="text-sm font-semibold text-white transition-colors"
              style={{
                backgroundColor: saving ? "rgba(208,74,2,0.4)" : "#D04A02",
                borderRadius: "4px",
                padding: "6px 20px",
                cursor: saving ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!saving)
                  e.currentTarget.style.backgroundColor = "#EB8C00";
              }}
              onMouseLeave={(e) => {
                if (!saving)
                  e.currentTarget.style.backgroundColor = "#D04A02";
              }}
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-8 py-6 max-w-4xl">
        {error && (
          <div
            className="mb-4 px-4 py-3 text-sm"
            style={{
              backgroundColor: "#FEF2F2",
              color: "#DC2626",
              borderRadius: "4px",
              border: "1px solid #FECACA",
            }}
          >
            {error}
          </div>
        )}

        {/* Company info section */}
        <div
          className="bg-white border p-6 mb-6"
          style={{ borderColor: "#DEDEDE", borderRadius: "4px" }}
        >
          <h3
            className="text-base font-bold mb-4 pb-3"
            style={{ color: "#2D2D2D", borderBottom: "1px solid #DEDEDE" }}
          >
            회사 정보
          </h3>
          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
            {infoField("회사명", user.company_name)}
            {infoField("역할", ROLE_LABELS[user.role] || user.role)}
          </div>
        </div>

        {/* User info section */}
        <div
          className="bg-white border p-6"
          style={{ borderColor: "#DEDEDE", borderRadius: "4px" }}
        >
          <h3
            className="text-base font-bold mb-4 pb-3"
            style={{ color: "#2D2D2D", borderBottom: "1px solid #DEDEDE" }}
          >
            사용자 정보
          </h3>
          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
            {infoField(
              "성명",
              user.name,
              <input
                type="text"
                className="border text-sm w-full"
                style={inputStyle}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            )}
            {infoField(
              "소속부서",
              user.department,
              <input
                type="text"
                className="border text-sm w-full"
                style={inputStyle}
                value={editDepartment}
                onChange={(e) => setEditDepartment(e.target.value)}
              />
            )}
            {infoField(
              "직책",
              user.title,
              <input
                type="text"
                className="border text-sm w-full"
                style={inputStyle}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            )}
            {infoField(
              "회사전화",
              user.phone_office,
              <input
                type="text"
                className="border text-sm w-full"
                style={inputStyle}
                value={editPhoneOffice}
                onChange={(e) => setEditPhoneOffice(e.target.value)}
              />
            )}
            {infoField(
              "휴대전화",
              user.phone_mobile,
              <input
                type="text"
                className="border text-sm w-full"
                style={inputStyle}
                value={editPhoneMobile}
                onChange={(e) => setEditPhoneMobile(e.target.value)}
              />
            )}
            {infoField("이메일", user.email)}
            {infoField("접속 IP", user.last_login_ip)}
            {infoField(
              "인증여부",
              user.is_verified ? "인증 완료" : "미인증"
            )}
          </div>
        </div>
      </div>

      {/* Reason Modal */}
      <ReasonModal
        isOpen={showReason}
        onConfirm={handleSave}
        onCancel={() => setShowReason(false)}
        title="수정 사유 입력"
      />
    </div>
  );
}
