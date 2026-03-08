"use client";
import DocumentsPageLayout from "@/components/documents/DocumentsPageLayout";
import { getAccessToken, parseTokenPayload } from "@/lib/auth";
import { can } from "@/lib/rbac";

export default function AccountantDocumentsPage() {
  const token = getAccessToken();
  const payload = token ? parseTokenPayload(token) : null;
  const role = (payload?.role as string) || "";

  return (
    <DocumentsPageLayout
      title="자료등록 — 회계법인"
      subtitle="회계법인 자료를 관리합니다."
      roleType="accountant"
      canWrite={can(role, "document:accountant:write")}
    />
  );
}
