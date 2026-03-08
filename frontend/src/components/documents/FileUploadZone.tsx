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

  const uploadFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("pool_id", String(poolId));
      formData.append("role_type", roleType);
      if (memo.trim()) formData.append("memo", memo.trim());

      await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMemo("");
      onUploaded();
    } catch (err: unknown) {
      const e = err as { response?: { status: number; data?: { detail?: string } } };
      setError(e.response?.data?.detail || "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }, [poolId, roleType, memo, onUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [uploadFile]);

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
        />
        <div className="text-3xl mb-2" style={{ color: "#7D7D7D" }}>📁</div>
        <p className="text-sm font-medium" style={{ color: "#2D2D2D" }}>
          {uploading ? "업로드 중..." : "파일을 드래그하거나 클릭하여 선택하세요"}
        </p>
        <p className="text-xs mt-1" style={{ color: "#7D7D7D" }}>
          허용 형식: PDF, XLSX, XLS, DOCX, DOC, ZIP, CSV, HWP (최대 500MB)
        </p>
      </div>

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

      {error && (
        <p className="text-xs" style={{ color: "#E0301E" }}>{error}</p>
      )}
    </div>
  );
}
