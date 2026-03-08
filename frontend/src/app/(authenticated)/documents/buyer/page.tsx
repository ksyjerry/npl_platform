"use client";
import DocumentsPageLayout from "@/components/documents/DocumentsPageLayout";
import { getAccessToken, parseTokenPayload } from "@/lib/auth";
import { can } from "@/lib/rbac";

export default function BuyerDocumentsPage() {
  const token = getAccessToken();
  const payload = token ? parseTokenPayload(token) : null;
  const role = (payload?.role as string) || "";

  return (
    <DocumentsPageLayout
      title="자료등록 — 매수인"
      subtitle="매수인 자료를 관리합니다."
      roleType="buyer"
      canWrite={can(role, "document:buyer:write")}
    />
  );
}
