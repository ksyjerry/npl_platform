"use client";

import { useState } from "react";
import api from "@/lib/api";

interface NoticeCreateModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function NoticeCreateModal({ onClose, onCreated }: NoticeCreateModalProps) {
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("category", category || "전체");
      formData.append("title", title);
      formData.append("content", content);
      if (file) formData.append("file", file);

      await api.post("/notices", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setToast({ type: "success", message: "공지사항이 등록되었습니다." });
      setTimeout(() => {
        setToast(null);
        onCreated();
      }, 1000);
    } catch {
      setToast({ type: "error", message: "등록 중 오류가 발생했습니다." });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-20"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="bg-white w-full"
          style={{
            maxWidth: "520px",
            borderRadius: "4px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          }}
        >
          {/* Header */}
          <div
            className="px-6 pt-6 pb-4 flex justify-between items-center"
            style={{ borderBottom: "1px solid #DEDEDE" }}
          >
            <h3 className="text-xl font-semibold" style={{ color: "#2D2D2D" }}>
              공지 등록
            </h3>
            <button onClick={onClose} className="p-1" style={{ color: "#7D7D7D" }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                  구분
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border text-base"
                  style={{ borderColor: "#DEDEDE", borderRadius: "4px", padding: "10px 14px", color: "#2D2D2D" }}
                  placeholder="예: PwC-SB 2026-1 Program 또는 전체"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                  제목 <span style={{ color: "#E0301E" }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border text-base"
                  style={{ borderColor: "#DEDEDE", borderRadius: "4px", padding: "10px 14px", color: "#2D2D2D" }}
                  placeholder="공지 제목을 입력해주세요"
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                  내용 <span style={{ color: "#E0301E" }}>*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="w-full border text-base resize-none"
                  style={{ borderColor: "#DEDEDE", borderRadius: "4px", padding: "10px 14px", color: "#2D2D2D" }}
                  placeholder="공지 내용을 입력해주세요"
                  required
                />
              </div>

              {/* File */}
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                  첨부파일
                </label>
                <div className="flex items-center gap-3">
                  <label
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold cursor-pointer transition-colors"
                    style={{
                      border: "1px solid #D04A02",
                      borderRadius: "4px",
                      color: "#D04A02",
                    }}
                  >
                    파일 선택
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      accept=".pdf,.xlsx,.docx,.zip"
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm" style={{ color: file ? "#2D2D2D" : "#7D7D7D" }}>
                    {file ? file.name : "선택된 파일 없음"}
                  </span>
                  {file && (
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-xs"
                      style={{ color: "#DC2626" }}
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-6 pb-6 pt-4 flex justify-end gap-3"
              style={{ borderTop: "1px solid #DEDEDE" }}
            >
              <button
                type="button"
                onClick={onClose}
                className="font-semibold border-2 transition-colors text-sm"
                style={{ borderColor: "#D04A02", color: "#D04A02", borderRadius: "4px", padding: "8px 24px" }}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="font-semibold text-white text-sm transition-colors"
                style={{
                  backgroundColor: submitting ? "rgba(208,74,2,0.4)" : "#D04A02",
                  borderRadius: "4px",
                  padding: "8px 24px",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "등록 중..." : "등록하기"}
              </button>
            </div>
          </form>
        </div>
      </div>

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
    </>
  );
}
