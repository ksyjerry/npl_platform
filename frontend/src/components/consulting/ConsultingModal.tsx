"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

interface ConsultingModalProps {
  type: "selling" | "buying";
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  position: string;
  email: string;
  title: string;
  content: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  title?: string;
  content?: string;
}

export default function ConsultingModal({
  type,
  isOpen,
  onClose,
}: ConsultingModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [form, setForm] = useState<FormData>({
    name: "",
    position: "",
    email: "",
    title: "",
    content: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  if (!isOpen) return null;

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "성함을 입력해주세요.";
    if (!form.email.trim()) errs.email = "이메일을 입력해주세요.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "올바른 이메일 형식을 입력해주세요.";
    if (!form.title.trim()) errs.title = "문의 제목을 입력해주세요.";
    if (form.content.length < 10) errs.content = "문의 내용을 10자 이상 입력해주세요.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const token = getAccessToken();
    if (!token) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/consulting", {
        type,
        name: form.name,
        position: form.position || undefined,
        email: form.email,
        title: form.title,
        content: form.content,
      });
      setToast({ type: "success", message: "상담 신청이 완료되었습니다." });
      setTimeout(() => {
        setToast(null);
        setForm({ name: "", position: "", email: "", title: "", content: "" });
        setErrors({});
        onClose();
      }, 1500);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      } else {
        setToast({ type: "error", message: "신청 중 오류가 발생했습니다." });
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (hasError: boolean) => ({
    borderColor: hasError ? "#E0301E" : "#DEDEDE",
    borderRadius: "4px",
    padding: "10px 14px",
    color: "#2D2D2D",
  });

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-12 overflow-y-auto"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Panel */}
        <div
          className="bg-white w-full my-8"
          style={{
            maxWidth: "600px",
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
              {type === "selling" ? "매각" : "인수"} 상담 신청
            </h3>
            <button onClick={onClose} className="p-1" style={{ color: "#7D7D7D" }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5">
              <p className="text-xs mb-5" style={{ color: "#7D7D7D" }}>
                <span style={{ color: "#E0301E" }}>*</span> 표시는 필수 입력 항목입니다.
              </p>

              {/* 성함 */}
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                  성함 <span style={{ color: "#E0301E" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="w-full border text-sm outline-none"
                  style={inputStyle(!!errors.name)}
                  placeholder="성함을 입력해주세요"
                />
                {errors.name && <p className="text-xs mt-1" style={{ color: "#E0301E" }}>{errors.name}</p>}
              </div>

              {/* 직책 */}
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                  직책
                </label>
                <input
                  type="text"
                  value={form.position}
                  onChange={(e) => update("position", e.target.value)}
                  className="w-full border text-sm outline-none"
                  style={inputStyle(false)}
                  placeholder="직책을 입력해주세요"
                />
              </div>

              {/* 이메일 */}
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                  이메일 <span style={{ color: "#E0301E" }}>*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="w-full border text-sm outline-none"
                  style={inputStyle(!!errors.email)}
                  placeholder="이메일을 입력해주세요"
                />
                {errors.email && <p className="text-xs mt-1" style={{ color: "#E0301E" }}>{errors.email}</p>}
              </div>

              {/* 문의 제목 */}
              <div className="mb-5">
                <label className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                  문의 제목 <span style={{ color: "#E0301E" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  className="w-full border text-sm outline-none"
                  style={inputStyle(!!errors.title)}
                  placeholder="문의 제목을 입력해주세요"
                />
                {errors.title && <p className="text-xs mt-1" style={{ color: "#E0301E" }}>{errors.title}</p>}
              </div>

              {/* 문의 내용 */}
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                  문의 내용 <span style={{ color: "#E0301E" }}>*</span>
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) => update("content", e.target.value)}
                  rows={6}
                  className="w-full border text-sm resize-vertical outline-none"
                  style={inputStyle(!!errors.content)}
                  placeholder="문의 내용을 입력해주세요 (10자 이상)"
                />
                {errors.content && <p className="text-xs mt-1" style={{ color: "#E0301E" }}>{errors.content}</p>}
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
                style={{
                  borderColor: "#D04A02",
                  color: "#D04A02",
                  borderRadius: "4px",
                  padding: "8px 24px",
                }}
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
                {submitting ? "신청 중..." : "신청하기"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast */}
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
          <p className="text-sm" style={{ color: "#2D2D2D" }}>
            {toast.message}
          </p>
        </div>
      )}
    </>
  );
}
