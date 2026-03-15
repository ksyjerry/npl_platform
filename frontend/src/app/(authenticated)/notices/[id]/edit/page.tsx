"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNoticeDetail } from "@/hooks/useNotices";
import api from "@/lib/api";
import RoleGuard from "@/components/auth/RoleGuard";
import ReasonModal from "@/components/ui/ReasonModal";
import type { NoticeFileItem } from "@/types/notice";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
const MAX_TOTAL_SIZE = 200 * 1024 * 1024; // 200MB total

function NoticeEditContent({ noticeId }: { noticeId: number }) {
  const router = useRouter();
  const { notice, loading, refetch } = useNoticeDetail(noticeId);
  const [category, setCategory] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // File management
  const [deletedFileIds, setDeletedFileIds] = useState<number[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // Use notice data as initial values (once loaded)
  const currentCategory = category ?? notice?.category ?? "";
  const currentTitle = title ?? notice?.title ?? "";
  const currentContent = content ?? notice?.content ?? "";

  // Existing files minus deleted ones
  const existingFiles = (notice?.files ?? []).filter((f) => !deletedFileIds.includes(f.id));

  const handleFileAdd = (fileList: FileList | null) => {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    const oversized = incoming.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setToast({ type: "error", message: `파일당 최대 50MB까지 업로드 가능합니다. (${oversized.map((f) => f.name).join(", ")})` });
      setTimeout(() => setToast(null), 4000);
      return;
    }
    const existingTotal = (notice?.files ?? [])
      .filter((f) => !deletedFileIds.includes(f.id))
      .reduce((sum, f) => sum + (f.file_size ?? 0), 0);
    const newTotal = existingTotal + newFiles.reduce((sum, f) => sum + f.size, 0) + incoming.reduce((sum, f) => sum + f.size, 0);
    if (newTotal > MAX_TOTAL_SIZE) {
      setToast({ type: "error", message: "전체 첨부파일 합계는 200MB를 초과할 수 없습니다." });
      setTimeout(() => setToast(null), 4000);
      return;
    }
    setNewFiles((prev) => [...prev, ...incoming]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTitle.trim() || !currentContent.trim()) return;
    setShowReasonModal(true);
  };

  const handleConfirm = async (reason: string) => {
    setShowReasonModal(false);
    setSubmitting(true);
    try {
      // 1. Update notice text
      await api.patch(`/notices/${noticeId}`, {
        reason,
        category: currentCategory || undefined,
        title: currentTitle,
        content: currentContent,
      });

      // 2. Delete removed files
      for (const fileId of deletedFileIds) {
        await api.delete(`/notices/${noticeId}/files/${fileId}`);
      }

      // 3. Upload new files
      if (newFiles.length > 0) {
        const formData = new FormData();
        newFiles.forEach((f) => formData.append("files", f));
        await api.post(`/notices/${noticeId}/files`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

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

  const formatSize = (size: number) =>
    size < 1024 * 1024 ? `${(size / 1024).toFixed(1)}KB` : `${(size / (1024 * 1024)).toFixed(1)}MB`;

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

          {/* Files */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "#2D2D2D" }}>
              첨부파일
            </label>
            <div className="flex items-center gap-3 mb-2">
              <label
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold cursor-pointer"
                style={{ border: "1px solid #D04A02", borderRadius: "4px", color: "#D04A02" }}
              >
                파일 선택
                <input
                  type="file"
                  onChange={(e) => { handleFileAdd(e.target.files); e.target.value = ""; }}
                  accept=".pdf,.xlsx,.docx,.zip,.csv,.hwp"
                  multiple
                  className="hidden"
                />
              </label>
              <span className="text-xs" style={{ color: "#7D7D7D" }}>파일당 50MB, 전체 200MB 이내</span>
            </div>

            {/* Existing files */}
            {existingFiles.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {existingFiles.map((f) => (
                  <div
                    key={`existing-${f.id}`}
                    className="flex items-center justify-between px-3 py-2 border text-sm"
                    style={{ borderColor: "#DEDEDE", borderRadius: "4px", backgroundColor: "#FAFAFA" }}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#2D2D2D" }}>{f.file_name}</span>
                      {f.file_size != null && (
                        <span style={{ color: "#7D7D7D" }}>({formatSize(f.file_size)})</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeletedFileIds((prev) => [...prev, f.id])}
                      className="text-xs font-medium hover:underline cursor-pointer"
                      style={{ color: "#E0301E" }}
                    >
                      제거
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New files */}
            {newFiles.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {newFiles.map((f, idx) => (
                  <div
                    key={`new-${idx}`}
                    className="flex items-center justify-between px-3 py-2 border text-sm"
                    style={{ borderColor: "#D04A02", borderRadius: "4px", backgroundColor: "#FFF5EE" }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#D04A02", color: "white" }}>NEW</span>
                      <span style={{ color: "#2D2D2D" }}>{f.name}</span>
                      <span style={{ color: "#7D7D7D" }}>({formatSize(f.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-xs font-medium hover:underline cursor-pointer"
                      style={{ color: "#E0301E" }}
                    >
                      제거
                    </button>
                  </div>
                ))}
              </div>
            )}
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
