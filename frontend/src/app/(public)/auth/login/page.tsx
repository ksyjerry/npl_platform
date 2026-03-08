"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { setAccessToken } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("이메일 형식이 아닙니다."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError("");
    try {
      const res = await api.post("/auth/login", data);
      setAccessToken(res.data.access_token);
      router.push("/");
    } catch (err: unknown) {
      const error = err as { response?: { status: number; data?: { detail?: string } } };
      if (error.response?.status === 401) {
        setServerError("이메일 또는 비밀번호가 일치하지 않습니다.");
      } else if (error.response?.status === 403) {
        setServerError("관리자 인증 대기 중입니다.");
      } else {
        setServerError("로그인에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5F5F5" }}>
      <div
        className="w-full max-w-[420px] mx-4 bg-white border p-8"
        style={{
          borderColor: "#DEDEDE",
          borderRadius: "4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <Image
              src="/pwc-logo.png"
              alt="PwC"
              width={64}
              height={32}
              style={{ objectFit: "contain", margin: "0 auto 12px" }}
            />
            <h1
              className="text-2xl font-bold"
              style={{ color: "#2D2D2D" }}
            >
              NPL Platform
            </h1>
          </Link>
          <p className="text-sm mt-2" style={{ color: "#7D7D7D" }}>
            로그인하여 서비스를 이용하세요.
          </p>
        </div>

        {serverError && (
          <div
            className="text-xs p-3 mb-4 border"
            style={{
              color: "#E0301E",
              backgroundColor: "#FEF9F9",
              borderColor: "#FECACA",
              borderRadius: "4px",
            }}
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold mb-1"
              style={{ color: "#2D2D2D" }}
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              placeholder="example@company.com"
              {...register("email")}
              className="w-full border text-base outline-none transition-colors"
              style={{
                borderColor: errors.email ? "#E0301E" : "#DEDEDE",
                borderRadius: "4px",
                padding: "10px 14px",
                color: "#2D2D2D",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#D04A02";
                e.target.style.boxShadow = "0 0 0 2px rgba(208,74,2,0.2)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.email ? "#E0301E" : "#DEDEDE";
                e.target.style.boxShadow = "none";
              }}
            />
            {errors.email && (
              <p className="text-xs mt-1" style={{ color: "#E0301E" }}>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold mb-1"
              style={{ color: "#2D2D2D" }}
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              {...register("password")}
              className="w-full border text-base outline-none transition-colors"
              style={{
                borderColor: errors.password ? "#E0301E" : "#DEDEDE",
                borderRadius: "4px",
                padding: "10px 14px",
                color: "#2D2D2D",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#D04A02";
                e.target.style.boxShadow = "0 0 0 2px rgba(208,74,2,0.2)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.password ? "#E0301E" : "#DEDEDE";
                e.target.style.boxShadow = "none";
              }}
            />
            {errors.password && (
              <p className="text-xs mt-1" style={{ color: "#E0301E" }}>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full text-white font-semibold transition-colors"
            style={{
              backgroundColor: isSubmitting ? "rgba(208,74,2,0.4)" : "#D04A02",
              borderRadius: "4px",
              padding: "12px 24px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
            onMouseOver={(e) => {
              if (!isSubmitting)
                (e.target as HTMLButtonElement).style.backgroundColor = "#EB8C00";
            }}
            onMouseOut={(e) => {
              if (!isSubmitting)
                (e.target as HTMLButtonElement).style.backgroundColor = "#D04A02";
            }}
          >
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* Footer link */}
        <p className="text-center text-sm mt-6" style={{ color: "#7D7D7D" }}>
          아직 계정이 없으신가요?{" "}
          <Link
            href="/auth/register"
            className="font-semibold hover:underline"
            style={{ color: "#D04A02" }}
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
