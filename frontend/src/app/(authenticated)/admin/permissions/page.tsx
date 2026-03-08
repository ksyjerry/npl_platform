"use client";

import RoleGuard from "@/components/auth/RoleGuard";
import AdminNav from "@/components/admin/AdminNav";
import { PERMISSIONS } from "@/lib/rbac";

const ROLE_LABELS: Record<string, string> = {
  admin: "관리자",
  accountant: "회계법인",
  seller: "매도인",
  buyer: "매수인",
};

const ROLES = ["admin", "accountant", "seller", "buyer"] as const;

const PERMISSION_GROUPS: { group: string; items: { key: string; label: string }[] }[] = [
  {
    group: "Pool 관리",
    items: [
      { key: "pool:write", label: "Pool 등록/수정" },
      { key: "pool:read_detail", label: "Pool 상세 열람" },
    ],
  },
  {
    group: "자료등록 — 매도인",
    items: [
      { key: "document:seller:read", label: "매도인 자료 열람" },
      { key: "document:seller:write", label: "매도인 자료 등록" },
    ],
  },
  {
    group: "자료등록 — 매수인",
    items: [
      { key: "document:buyer:read", label: "매수인 자료 열람" },
      { key: "document:buyer:write", label: "매수인 자료 등록" },
    ],
  },
  {
    group: "자료등록 — 회계법인",
    items: [
      { key: "document:accountant:read", label: "회계법인 자료 열람" },
      { key: "document:accountant:write", label: "회계법인 자료 등록" },
    ],
  },
  {
    group: "공지사항",
    items: [
      { key: "notice:write", label: "공지사항 작성" },
      { key: "notice:edit", label: "공지사항 수정" },
      { key: "notice:delete", label: "공지사항 삭제" },
    ],
  },
  {
    group: "상담 관리",
    items: [
      { key: "consulting:view", label: "상담 내역 열람" },
      { key: "consulting:reply", label: "상담 답변" },
    ],
  },
  {
    group: "관리자",
    items: [
      { key: "admin:access", label: "관리자 페이지 접근" },
    ],
  },
];

function PermissionsContent() {
  return (
    <div>
      {/* Title */}
      <div className="px-8 py-5" style={{ borderBottom: "1px solid #DEDEDE" }}>
        <h2 className="text-xl font-bold" style={{ color: "#2D2D2D" }}>
          권한 관리
        </h2>
        <p className="text-sm mt-1" style={{ color: "#7D7D7D" }}>
          역할별 기능 접근 권한 현황입니다.
        </p>
      </div>

      <div className="px-8 py-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#2D2D2D" }}>
                <th className="px-4 py-3 text-left font-semibold text-white" style={{ minWidth: "140px" }}>
                  구분
                </th>
                <th className="px-4 py-3 text-left font-semibold text-white" style={{ minWidth: "180px" }}>
                  권한
                </th>
                {ROLES.map((r) => (
                  <th key={r} className="px-4 py-3 text-center font-semibold text-white" style={{ minWidth: "100px" }}>
                    {ROLE_LABELS[r]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.map((group) =>
                group.items.map((item, idx) => {
                  const allowedRoles = PERMISSIONS[item.key as keyof typeof PERMISSIONS] as readonly string[];
                  return (
                    <tr
                      key={item.key}
                      style={{
                        borderBottom: "1px solid #DEDEDE",
                        backgroundColor: idx === 0 && group.items.length > 1 ? "#FAFAFA" : "#FFFFFF",
                      }}
                    >
                      {idx === 0 && (
                        <td
                          className="px-4 py-3 font-semibold align-top"
                          style={{ color: "#2D2D2D", backgroundColor: "#F5F5F5", borderRight: "1px solid #DEDEDE" }}
                          rowSpan={group.items.length}
                        >
                          {group.group}
                        </td>
                      )}
                      <td className="px-4 py-3" style={{ color: "#464646" }}>
                        {item.label}
                      </td>
                      {ROLES.map((r) => (
                        <td key={r} className="px-4 py-3 text-center">
                          {allowedRoles.includes(r) ? (
                            <span
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                              style={{ backgroundColor: "#E8F5E9", color: "#2E7D32" }}
                            >
                              ✓
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs"
                              style={{ backgroundColor: "#F5F5F5", color: "#DEDEDE" }}
                            >
                              —
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 flex gap-6">
          <div className="flex items-center gap-2 text-sm" style={{ color: "#464646" }}>
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
              style={{ backgroundColor: "#E8F5E9", color: "#2E7D32" }}
            >
              ✓
            </span>
            접근 가능
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: "#464646" }}>
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs"
              style={{ backgroundColor: "#F5F5F5", color: "#DEDEDE" }}
            >
              —
            </span>
            접근 불가
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPermissionsPage() {
  return (
    <RoleGuard permission="admin:access">
      <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
        <AdminNav />
        <PermissionsContent />
      </div>
    </RoleGuard>
  );
}
