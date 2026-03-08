"use client";

import { useEffect, useState } from "react";
import { getAccessToken, parseTokenPayload } from "@/lib/auth";
import { can } from "@/lib/rbac";
import DocumentsPageLayout from "@/components/documents/DocumentsPageLayout";

interface Tab {
  key: string;
  label: string;
  roleType: string;
  readPermission: "document:seller:read" | "document:buyer:read" | "document:accountant:read";
  writePermission: "document:seller:write" | "document:buyer:write" | "document:accountant:write";
}

const ALL_TABS: Tab[] = [
  {
    key: "seller",
    label: "매도인",
    roleType: "seller",
    readPermission: "document:seller:read",
    writePermission: "document:seller:write",
  },
  {
    key: "buyer",
    label: "매수인",
    roleType: "buyer",
    readPermission: "document:buyer:read",
    writePermission: "document:buyer:write",
  },
  {
    key: "accountant",
    label: "회계법인",
    roleType: "accountant",
    readPermission: "document:accountant:read",
    writePermission: "document:accountant:write",
  },
];

export default function DocumentsPage() {
  const [role, setRole] = useState("");
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const payload = parseTokenPayload(token);
      if (payload) {
        const r = payload.role as string;
        setRole(r);
        // Set initial tab based on role
        if (r === "seller") setActiveTab("seller");
        else if (r === "buyer") setActiveTab("buyer");
        else setActiveTab("seller"); // admin/accountant default to seller tab
      }
    }
  }, []);

  const visibleTabs = ALL_TABS.filter((t) => can(role, t.readPermission));
  const currentTab = visibleTabs.find((t) => t.key === activeTab) || visibleTabs[0];

  if (!role || !currentTab) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{ borderColor: "#DEDEDE", borderTopColor: "#D04A02" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Header */}
      <div className="px-8 py-5" style={{ borderBottom: "1px solid #DEDEDE" }}>
        <h1 className="text-xl font-bold" style={{ color: "#2D2D2D" }}>
          자료등록
        </h1>
        <p className="text-sm mt-1" style={{ color: "#7D7D7D" }}>
          역할별 거래 자료를 등록하고 관리합니다.
        </p>
      </div>

      {/* Tabs */}
      {visibleTabs.length > 1 && (
        <div
          className="px-8 flex gap-0"
          style={{ borderBottom: "2px solid #DEDEDE" }}
        >
          {visibleTabs.map((tab) => {
            const isActive = tab.key === currentTab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-6 py-3 text-sm font-medium transition-colors relative"
                style={{
                  color: isActive ? "#D04A02" : "#7D7D7D",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {tab.label}
                {isActive && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: "#D04A02", bottom: "-2px" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Content — reuse DocumentsPageLayout without its own title bar */}
      <DocumentsPageLayout
        title={`자료등록 — ${currentTab.label}`}
        subtitle={`${currentTab.label} 자료를 관리합니다.`}
        roleType={currentTab.roleType}
        canWrite={can(role, currentTab.writePermission)}
        hideTitle
      />
    </div>
  );
}
