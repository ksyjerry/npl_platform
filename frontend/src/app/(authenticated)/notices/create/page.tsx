"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import RoleGuard from "@/components/auth/RoleGuard";

interface PoolOption {
  id: number;
  name: string;
}

function NoticeCreateContent() {
  const router = useRouter();
  const [poolId, setPoolId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pools, setPools] = useState<PoolOption[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    api.get("/pools", { params: { size: 200 } })
      .then((res) => setPools(res.data.items.map((p: { id: number; name: string }) => ({ id: p.id, name: p.name }))))
      .catch(() => {});
  }, []);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
  const MAX_TOTAL_SIZE = 200 * 1024 * 1024; // 200MB total

  const handleFileAdd = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const incoming = Array.from(newFiles);
    const currentTotal = files.reduce((sum, f) => sum + f.size, 0);
    const oversized = incoming.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setToast({ type: "error", message: `파일당 최대 50MB까지 업로드 가능합니다. (${oversized.map((f) => f.name).join(", ")})` });
      setTimeout(() => setToast(null), 4000);
      return;
    }
    const newTotal = currentTotal + incoming.reduce((sum, f) => sum + f.size, 0);
    if (newTotal > MAX_TOTAL_SIZE) {
      setToast({ type: "error", message: "전체 첨부파일 합계는 200MB를 초과할 수 없습니다." });
      setTimeout(() => setToast(null), 4000);
      return;
    }
    setFiles((prev) => [...prev, ...incoming]);
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
      const selectedPool = pools.find((p) => String(p.id) === poolId);
      formData.append("category", selectedPool ? selectedPool.name : "전체");
      formData.append("title", title);
      formData.append("content", content);
      if (poolId) formData.append("pool_id", poolId);
      files.forEach((f) => formData.append("files", f));

      await api.post("/notices", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setToast({ type: "success", message: "공지사항이 등록되었습니다." });
      setTimeout(() => {
        router.push("/notices");
      }, 1000);
    } catch {
      setToast({ type: "error", message: "등록 중 오류가 발생했습니다." });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

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
        <span style={{ color: "#2D2D2D" }}>공지 등록</span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-8 py-8">
        <div className="space-y-5">
          {/* 구분 (Pool 선택 통합) */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "#2D2D2D" }}>
              구분
            </label>
            <select
              value={poolId}
              onChange={(e) => setPoolId(e.target.value)}
              className="w-full border text-sm outline-none"
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
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "#2D2D2D" }}>
              제목 <span style={{ color: "#E0301E" }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border text-sm outline-none"
              style={{ borderColor: "#DEDEDE", borderRadius: "4px", padding: "10px 14px", color: "#2D2D2D" }}
              placeholder="공지 제목을 입력해주세요"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "#2D2D2D" }}>
              내용 <span style={{ color: "#E0301E" }}>*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full border text-sm resize-none outline-none"
              style={{ borderColor: "#DEDEDE", borderRadius: "4px", padding: "10px 14px", color: "#2D2D2D" }}
              placeholder="공지 내용을 입력해주세요"
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
            {files.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {files.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 border text-sm"
                    style={{ borderColor: "#DEDEDE", borderRadius: "4px", backgroundColor: "#FAFAFA" }}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: "#2D2D2D" }}>{f.name}</span>
                      <span style={{ color: "#7D7D7D" }}>
                        ({f.size < 1024 * 1024 ? `${(f.size / 1024).toFixed(1)}KB` : `${(f.size / (1024 * 1024)).toFixed(1)}MB`})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFileRemove(idx)}
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
            href="/notices"
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
            {submitting ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </form>

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

export default function NoticeCreatePage() {
  return (
    <RoleGuard permission="notice:create">
      <NoticeCreateContent />
    </RoleGuard>
  );
}
