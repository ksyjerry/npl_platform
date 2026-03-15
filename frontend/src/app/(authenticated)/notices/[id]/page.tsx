"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useNoticeDetail } from "@/hooks/useNotices";
import { can } from "@/lib/rbac";
import { getAccessToken, parseTokenPayload } from "@/lib/auth";
import api from "@/lib/api";
import ReasonModal from "@/components/ui/ReasonModal";

export default function NoticeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const noticeId = Number(id);
  const { notice, loading, refetch } = useNoticeDetail(noticeId);
  const [role, setRole] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const payload = parseTokenPayload(token);
      if (payload) setRole(payload.role as string);
    }
  }, []);

  const handleDelete = async (reason: string) => {
    try {
      await api.delete(`/notices/${noticeId}`, { data: { reason } });
      setToast({ type: "success", message: "공지사항이 삭제되었습니다." });
      setTimeout(() => router.push("/notices"), 1000);
    } catch {
      setToast({ type: "error", message: "삭제 중 오류가 발생했습니다." });
      setTimeout(() => setToast(null), 3000);
    }
    setShowDeleteModal(false);
  };

  const handleFileDownload = async (nId: number, fileId: number, fileName: string) => {
    try {
      const res = await api.get(`/notices/${nId}/files/${fileId}/download`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ type: "error", message: "파일 다운로드에 실패했습니다." });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDownload = async (docId: number, fileName: string) => {
    try {
      const res = await api.get(`/documents/${docId}/download`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ type: "error", message: "파일 다운로드에 실패했습니다." });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const formatDate = (d: string) => d.slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div
          className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{ borderColor: "#DEDEDE", borderTopColor: "#D04A02" }}
        />
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="text-center py-24" style={{ color: "#7D7D7D" }}>
        공지사항을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Breadcrumb */}
      <div
        className="px-8 py-3 text-sm"
        style={{ backgroundColor: "#F5F5F5", borderBottom: "1px solid #DEDEDE", color: "#7D7D7D" }}
      >
        <Link href="/notices" className="hover:underline">
          공지사항
        </Link>
        <span className="mx-2">{">"}</span>
        <span style={{ color: "#2D2D2D" }}>{notice.title}</span>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-8 py-8">
        <div
          className="border p-8"
          style={{ borderColor: "#DEDEDE", borderRadius: "4px" }}
        >
          {/* Header */}
          <div className="mb-6" style={{ borderBottom: "1px solid #DEDEDE", paddingBottom: "24px" }}>
            <span
              className="inline-block text-xs px-2.5 py-0.5 rounded-full font-medium border mb-3"
              style={{
                backgroundColor: "#F5F5F5",
                color: "#464646",
                borderColor: "#DEDEDE",
              }}
            >
              {notice.category}
            </span>
            <h2 className="text-2xl font-bold" style={{ color: "#2D2D2D" }}>
              {notice.title}
            </h2>
            <p className="text-xs mt-2" style={{ color: "#7D7D7D" }}>
              {notice.created_by_name} · {formatDate(notice.created_at)}
            </p>
          </div>

          {/* Body */}
          <div
            className="text-base whitespace-pre-wrap leading-relaxed"
            style={{ color: "#464646" }}
          >
            {notice.content}
          </div>

          {/* Attachments — multiple files */}
          {notice.files && notice.files.length > 0 && (
            <div className="mt-8 pt-6 space-y-2" style={{ borderTop: "1px solid #DEDEDE" }}>
              <p className="text-sm font-semibold" style={{ color: "#2D2D2D" }}>첨부파일</p>
              {notice.files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => handleFileDownload(noticeId, file.id, file.file_name)}
                  className="flex items-center gap-2 text-sm hover:underline cursor-pointer"
                  style={{ color: "#D04A02" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                  {file.file_name}
                  {file.file_size != null && (
                    <span style={{ color: "#7D7D7D" }}>
                      ({file.file_size < 1024 * 1024
                        ? `${(file.file_size / 1024).toFixed(1)}KB`
                        : `${(file.file_size / (1024 * 1024)).toFixed(1)}MB`})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          {/* Legacy single attachment fallback */}
          {(!notice.files || notice.files.length === 0) && notice.attachment_doc_id && notice.attachment_name && (
            <div className="mt-8 pt-6" style={{ borderTop: "1px solid #DEDEDE" }}>
              <button
                onClick={() => handleDownload(notice.attachment_doc_id!, notice.attachment_name!)}
                className="flex items-center gap-2 text-sm hover:underline cursor-pointer"
                style={{ color: "#D04A02" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
                {notice.attachment_name}
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 pt-6 flex items-center gap-3" style={{ borderTop: "1px solid #DEDEDE" }}>
            <Link
              href="/notices"
              className="text-sm font-semibold hover:underline"
              style={{ color: "#D04A02" }}
            >
              목록으로
            </Link>
            {can(role, "notice:edit") && (
              <>
                <span style={{ color: "#DEDEDE" }}>|</span>
                <Link
                  href={`/notices/${noticeId}/edit`}
                  className="text-sm font-semibold hover:underline"
                  style={{ color: "#D04A02" }}
                >
                  수정
                </Link>
              </>
            )}
            {can(role, "notice:delete") && (
              <>
                <span style={{ color: "#DEDEDE" }}>|</span>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="text-sm hover:underline cursor-pointer"
                  style={{ color: "#E0301E" }}
                >
                  삭제
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <ReasonModal
          isOpen
          title="공지사항 삭제"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 bg-white"
          style={{
            maxWidth: "360px",
            width: "100%",
            borderRadius: "4px",
            padding: "16px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            borderLeft: `4px solid ${toast.type === "success" ? "#166534" : "#E0301E"}`,
          }}
        >
          <p className="text-sm" style={{ color: "#2D2D2D" }}>
            {toast.message}
          </p>
        </div>
      )}
    </div>
  );
}
