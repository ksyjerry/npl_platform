"use client";

import { useCallback, useRef, useState } from "react";
import api from "@/lib/api";

const ALLOWED_EXTENSIONS = [".pdf", ".xlsx", ".xls", ".docx", ".doc", ".zip", ".csv", ".hwp"];
const MAX_SIZE = 500 * 1024 * 1024;

interface FileUploadZoneProps {
  poolId: number;
  roleType: string;
  onUploaded: () => void;
}

export default function FileUploadZone({ poolId, roleType, onUploaded }: FileUploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memo, setMemo] = useState("");
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `허용되지 않는 파일 형식입니다: ${ext}`;
    }
    if (file.size > MAX_SIZE) {
      return "파일 크기가 500MB를 초과합니다.";
    }
    return null;
  };

  const addFiles = useCallback((newFiles: File[]) => {
    const validFiles: File[] = [];
    for (const file of newFiles) {
      const err = validateFile(file);
      if (err) {
        setError(err);
        return;
      }
      validFiles.push(file);
    }
    setError(null);
    setStagedFiles((prev) => [...prev, ...validFiles]);
  }, []);

  const removeStaged = (idx: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (stagedFiles.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of stagedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("pool_id", String(poolId));
        formData.append("role_type", roleType);
        if (memo.trim()) formData.append("memo", memo.trim());

        await api.post("/documents/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setStagedFiles([]);
      setMemo("");
      setToast(`${stagedFiles.length}개 파일 업로드 완료`);
      setTimeout(() => setToast(null), 3000);
      onUploaded();
    } catch (err: unknown) {
      const e = err as { response?: { status: number; data?: { detail?: string } } };
      setError(e.response?.data?.detail || "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) addFiles(droppedFiles);
  }, [addFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (selectedFiles.length > 0) addFiles(selectedFiles);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [addFiles]);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed text-center py-8 cursor-pointer transition-colors"
        style={{
          borderColor: dragging ? "#D04A02" : "#DEDEDE",
          backgroundColor: dragging ? "#FFF5EE" : "#FAFAFA",
          borderRadius: "4px",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_EXTENSIONS.join(",")}
          onChange={handleFileSelect}
          multiple
        />
        <div className="text-3xl mb-2" style={{ color: "#7D7D7D" }}>📁</div>
        <p className="text-sm font-medium" style={{ color: "#2D2D2D" }}>
          파일을 드래그하거나 클릭하여 선택하세요
        </p>
        <p className="text-xs mt-1" style={{ color: "#7D7D7D" }}>
          허용 형식: PDF, XLSX, XLS, DOCX, DOC, ZIP, CSV, HWP (최대 500MB)
        </p>
      </div>

      {/* Staged files list */}
      {stagedFiles.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-semibold" style={{ color: "#2D2D2D" }}>
            대기 파일 ({stagedFiles.length}개)
          </p>
          {stagedFiles.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm px-3 py-2 border" style={{ borderColor: "#DEDEDE", borderRadius: "4px" }}>
              <div className="flex items-center gap-2">
                <span style={{ color: "#2D2D2D" }}>{file.name}</span>
                <span style={{ color: "#7D7D7D" }}>
                  ({file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)}KB` : `${(file.size / (1024 * 1024)).toFixed(1)}MB`})
                </span>
              </div>
              <button
                onClick={() => removeStaged(idx)}
                className="text-xs px-2 py-1"
                style={{ color: "#DC2626" }}
              >
                제거
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Memo input */}
      <div>
        <input
          type="text"
          placeholder="메모 (선택)"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="w-full border text-sm outline-none"
          style={{
            borderColor: "#DEDEDE",
            borderRadius: "4px",
            padding: "8px 12px",
            color: "#2D2D2D",
          }}
          onFocus={(e) => { e.target.style.borderColor = "#D04A02"; }}
          onBlur={(e) => { e.target.style.borderColor = "#DEDEDE"; }}
        />
      </div>

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={stagedFiles.length === 0 || uploading}
        className="w-full py-2.5 text-sm font-semibold text-white transition-colors"
        style={{
          backgroundColor: stagedFiles.length > 0 && !uploading ? "#D04A02" : "rgba(208,74,2,0.4)",
          borderRadius: "4px",
          cursor: stagedFiles.length > 0 && !uploading ? "pointer" : "not-allowed",
        }}
      >
        {uploading ? "업로드 중..." : `업로드 (${stagedFiles.length}개)`}
      </button>

      {error && (
        <p className="text-xs" style={{ color: "#E0301E" }}>{error}</p>
      )}

      {toast && (
        <p className="text-xs font-medium" style={{ color: "#166534" }}>{toast}</p>
      )}
    </div>
  );
}
