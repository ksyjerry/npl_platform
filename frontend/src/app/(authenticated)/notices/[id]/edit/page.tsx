"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNoticeDetail } from "@/hooks/useNotices";
import api from "@/lib/api";
import RoleGuard from "@/components/auth/RoleGuard";
import ReasonModal from "@/components/ui/ReasonModal";

function NoticeEditContent({ noticeId }: { noticeId: number }) {
  const router = useRouter();
  const { notice, loading } = useNoticeDetail(noticeId);
  const [category, setCategory] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Use notice data as initial values (once loaded)
  const currentCategory = category ?? notice?.category ?? "";
  const currentTitle = title ?? notice?.title ?? "";
  const currentContent = content ?? notice?.content ?? "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTitle.trim() || !currentContent.trim()) return;
    setShowReasonModal(true);
  };

  const handleConfirm = async (reason: string) => {
    setShowReasonModal(false);
    setSubmitting(true);
    try {
      await api.patch(`/notices/${noticeId}`, {
        reason,
        category: currentCategory || undefined,
        title: currentTitle,
        content: currentContent,
      });
      setToast({ type: "success", message: "공지사항이 수정되었습니다." });
      setTimeout(() => {
        router.push(`/notices/${noticeId}`);
      }, 1000);
    } catch {
      setToast({ type: "error", message: "수정 중 오류가 발생했습니다." });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "#DEDEDE", borderTopColor: "#D04A02" }} />
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2" style={{ color: "#E0301E" }}>공지사항을 찾을 수 없습니다.</p>
          <Link href="/notices" className="text-sm font-medium hover:underline" style={{ color: "#D04A02" }}>
            목록으로 돌아가기
          </Link>
        </div>
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
        <Link href="/notices" className="hover:underline" style={{ color: "#7D7D7D" }}>
          공지사항
        </Link>
        <span className="mx-2">{">"}</span>
        <Link href={`/notices/${noticeId}`} className="hover:underline" style={{ color: "#7D7D7D" }}>
          {notice.title}
        </Link>
        <span className="mx-2">{">"}</span>
        <span style={{ color: "#2D2D2D" }}>수정</span>
      </div>

      {/* Title */}
      <div className="px-8 py-5" style={{ borderBottom: "1px solid #DEDEDE" }}>
        <h2 className="text-xl font-bold" style={{ color: "#2D2D2D" }}>공지 수정</h2>
        <p className="text-sm mt-1" style={{ color: "#7D7D7D" }}>공지사항을 수정합니다. 수정 시 사유 입력이 필요합니다.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-8 py-8">
        <div className="space-y-5">
          {/* Category */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "#2D2D2D" }}>
              구분
            </label>
            <input
              type="text"
              value={currentCategory}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border text-sm outline-none"
              style={{ borderColor: "#DEDEDE", borderRadius: "4px", padding: "10px 14px", color: "#2D2D2D" }}
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "#2D2D2D" }}>
              제목 <span style={{ color: "#E0301E" }}>*</span>
            </label>
            <input
              type="text"
              value={currentTitle}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border text-sm outline-none"
              style={{ borderColor: "#DEDEDE", borderRadius: "4px", padding: "10px 14px", color: "#2D2D2D" }}
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "#2D2D2D" }}>
              내용 <span style={{ color: "#E0301E" }}>*</span>
            </label>
            <textarea
              value={currentContent}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full border text-sm resize-none outline-none"
              style={{ borderColor: "#DEDEDE", borderRadius: "4px", padding: "10px 14px", color: "#2D2D2D" }}
              required
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8 pt-6" style={{ borderTop: "1px solid #DEDEDE" }}>
          <Link
            href={`/notices/${noticeId}`}
            className="inline-flex items-center font-semibold border-2 text-sm transition-colors"
            style={{ borderColor: "#D04A02", color: "#D04A02", borderRadius: "4px", padding: "10px 28px" }}
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="font-semibold text-white text-sm transition-colors"
            style={{
              backgroundColor: submitting ? "rgba(208,74,2,0.4)" : "#D04A02",
              borderRadius: "4px",
              padding: "10px 28px",
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "수정 중..." : "수정하기"}
          </button>
        </div>
      </form>

      {showReasonModal && (
        <ReasonModal
          isOpen
          title="공지사항 수정 사유"
          onConfirm={handleConfirm}
          onCancel={() => setShowReasonModal(false)}
        />
      )}

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[60] bg-white"
          style={{
            maxWidth: "360px",
            width: "100%",
            borderRadius: "4px",
            padding: "16px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            borderLeft: `4px solid ${toast.type === "success" ? "#166534" : "#E0301E"}`,
          }}
        >
          <p className="text-sm" style={{ color: "#2D2D2D" }}>{toast.message}</p>
        </div>
      )}
    </div>
  );
}

export default function NoticeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RoleGuard permission="notice:edit">
      <NoticeEditContent noticeId={Number(id)} />
    </RoleGuard>
  );
}
