"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

interface PoolOption {
  id: number;
  name: string;
}

interface NoticeCreateModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function NoticeCreateModal({ onClose, onCreated }: NoticeCreateModalProps) {
  const [selectedPool, setSelectedPool] = useState<string>(""); // "" = 전체 공지, "id" = pool id
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [pools, setPools] = useState<PoolOption[]>([]);

  useEffect(() => {
    api.get("/pools", { params: { status: "active", size: 100 } })
      .then((res) => setPools(res.data.items.map((p: { id: number; name: string }) => ({ id: p.id, name: p.name }))))
      .catch(() => {});
  }, []);

  const handleFileAdd = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
  };

  const handleFileRemove = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      const pool = pools.find((p) => String(p.id) === selectedPool);
      formData.append("category", pool ? pool.name : "전체");
      formData.append("title", title);
      formData.append("content", content);
      if (selectedPool) formData.append("pool_id", selectedPool);
      files.forEach((f) => formData.append("files", f));

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
            <button onClick={onClose} className="p-1 cursor-pointer" style={{ color: "#7D7D7D" }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 space-y-4">
              {/* 구분 (Pool 선택 통합) */}
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                  구분
                </label>
                <select
                  value={selectedPool}
                  onChange={(e) => setSelectedPool(e.target.value)}
                  className="w-full border text-base"
                  style={{ borderColor: "#DEDEDE", borderRadius: "4px", padding: "10px 14px", color: "#2D2D2D" }}
                >
                  <option value="">전체 공지</option>
                  {pools.map((p) => (
                    <option key={p.id} value={String(p.id)}>{p.name}</option>
                  ))}
                </select>
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

              {/* Multiple Files (CR-05) */}
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                  첨부파일
                </label>
                <div className="flex items-center gap-3 mb-2">
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
                      onChange={(e) => handleFileAdd(e.target.files)}
                      accept=".pdf,.xlsx,.docx,.zip,.csv,.hwp"
                      multiple
                      className="hidden"
                    />
                  </label>
                  {files.length === 0 && (
                    <span className="text-sm" style={{ color: "#7D7D7D" }}>선택된 파일 없음</span>
                  )}
                </div>
                {files.length > 0 && (
                  <div className="space-y-1">
                    {files.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm" style={{ color: "#2D2D2D" }}>
                        <span>{f.name}</span>
                        <span style={{ color: "#7D7D7D" }}>
                          ({f.size < 1024 * 1024 ? `${(f.size / 1024).toFixed(1)}KB` : `${(f.size / (1024 * 1024)).toFixed(1)}MB`})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleFileRemove(idx)}
                          className="text-xs cursor-pointer"
                          style={{ color: "#DC2626" }}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                className="font-semibold border-2 transition-colors text-sm cursor-pointer"
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
