"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const registerSchema = z
  .object({
    member_type: z.enum(["seller", "buyer", "accountant"], {
      message: "회원유형을 선택해주세요.",
    }),
    name: z.string().min(1, "이름을 입력해주세요."),
    company_name: z.string().min(1, "회사명을 입력해주세요."),
    department: z.string().min(1, "담당부서명을 입력해주세요."),
    title: z.string().min(1, "직책을 입력해주세요."),
    phone_office: z.string().min(1, "회사전화를 입력해주세요."),
    phone_mobile: z.string().min(1, "휴대전화를 입력해주세요."),
    email: z.string().email("이메일 형식이 아닙니다."),
    password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다."),
    password_confirm: z.string(),
    interests: z.array(z.string()).default([]),
    terms_1: z.boolean().refine((v) => v === true, { message: "약관에 동의해주세요." }),
    terms_2: z.boolean().refine((v) => v === true, { message: "약관에 동의해주세요." }),
    terms_3: z.boolean().refine((v) => v === true, { message: "약관에 동의해주세요." }),
  })
  .refine((d) => d.password === d.password_confirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["password_confirm"],
  });

type RegisterForm = z.input<typeof registerSchema>;

const MEMBER_TYPES = [
  { value: "seller" as const, label: "매도인 (금융기관)" },
  { value: "buyer" as const, label: "매수인 (F&I, 자산운용사)" },
  { value: "accountant" as const, label: "회계법인 (삼일PwC)" },
];

const inputStyle = (hasError: boolean) => ({
  borderColor: hasError ? "#E0301E" : "#DEDEDE",
  borderRadius: "4px",
  padding: "10px 14px",
  color: "#2D2D2D",
});

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      interests: [],
      terms_1: false,
      terms_2: false,
      terms_3: false,
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setServerError("");
    try {
      await api.post("/auth/register", data);
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { status: number; data?: { detail?: string } } };
      if (error.response?.status === 409) {
        setServerError("이미 존재하는 이메일입니다.");
      } else if (error.response?.status === 422) {
        setServerError(error.response.data?.detail || "입력 정보를 확인해주세요.");
      } else {
        setServerError("회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F5F5F5" }}
      >
        <div
          className="w-full max-w-[480px] mx-4 bg-white border p-8 text-center"
          style={{
            borderColor: "#DEDEDE",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#F0FDF4" }}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="#166534"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: "#2D2D2D" }}
          >
            회원가입이 완료되었습니다
          </h2>
          <p className="text-sm mb-6" style={{ color: "#7D7D7D" }}>
            관리자 인증 후 서비스를 이용하실 수 있습니다.
            <br />
            인증 완료 시 별도로 안내드리겠습니다.
          </p>
          <Link
            href="/auth/login"
            className="inline-block text-white font-semibold transition-colors"
            style={{
              backgroundColor: "#D04A02",
              borderRadius: "4px",
              padding: "12px 32px",
            }}
          >
            로그인 페이지로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-12"
      style={{ backgroundColor: "#F5F5F5" }}
    >
      <div
        className="w-full max-w-[600px] mx-auto px-4"
      >
        {/* Header */}
        <div className="text-center mb-8">
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
            회원가입
          </h1>
          <p className="text-sm mt-2" style={{ color: "#7D7D7D" }}>
            필수 항목(*)을 모두 입력해주세요.
          </p>
        </div>

        <div
          className="bg-white border p-8"
          style={{
            borderColor: "#DEDEDE",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {serverError && (
            <div
              className="text-xs p-3 mb-6 border"
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Section: 회원유형 */}
            <fieldset>
              <legend
                className="text-base font-bold pb-3 mb-4 w-full"
                style={{
                  color: "#2D2D2D",
                  borderBottom: "1px solid #DEDEDE",
                }}
              >
                회원유형 <span style={{ color: "#E0301E" }}>*</span>
              </legend>
              <div className="flex flex-wrap gap-3">
                {MEMBER_TYPES.map((t) => (
                  <label
                    key={t.value}
                    className="flex items-center gap-2 cursor-pointer text-sm border px-4 py-2.5 transition-colors"
                    style={{
                      borderRadius: "4px",
                      borderColor:
                        watch("member_type") === t.value ? "#D04A02" : "#DEDEDE",
                      backgroundColor:
                        watch("member_type") === t.value ? "#FFF5EE" : "white",
                      color: "#2D2D2D",
                    }}
                  >
                    <input
                      type="radio"
                      value={t.value}
                      {...register("member_type")}
                      className="accent-[#D04A02]"
                    />
                    {t.label}
                  </label>
                ))}
              </div>
              {errors.member_type && (
                <p className="text-xs mt-1" style={{ color: "#E0301E" }}>
                  {errors.member_type.message}
                </p>
              )}
            </fieldset>

            {/* Section: 기본 정보 */}
            <fieldset>
              <legend
                className="text-base font-bold pb-3 mb-4 w-full"
                style={{
                  color: "#2D2D2D",
                  borderBottom: "1px solid #DEDEDE",
                }}
              >
                기본 정보
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                    이름 <span style={{ color: "#E0301E" }}>*</span>
                  </label>
                  <input id="name" {...register("name")} className="w-full border text-base outline-none" style={inputStyle(!!errors.name)} placeholder="홍길동" />
                  {errors.name && <p className="text-xs mt-1" style={{ color: "#E0301E" }}>{errors.name.message}</p>}
                </div>
                {/* Company */}
                <div>
                  <label htmlFor="company_name" className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                    회사명 <span style={{ color: "#E0301E" }}>*</span>
                  </label>
                  <input id="company_name" {...register("company_name")} className="w-full border text-base outline-none" style={inputStyle(!!errors.company_name)} placeholder="OO저축은행" />
                  {errors.company_name && <p className="text-xs mt-1" style={{ color: "#E0301E" }}>{errors.company_name.message}</p>}
                </div>
                {/* Department */}
                <div>
                  <label htmlFor="department" className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                    담당부서명 <span style={{ color: "#E0301E" }}>*</span>
                  </label>
                  <input id="department" {...register("department")} className="w-full border text-base outline-none" style={inputStyle(!!errors.department)} placeholder="여신관리부" />
                  {errors.department && <p className="text-xs mt-1" style={{ color: "#E0301E" }}>{errors.department.message}</p>}
                </div>
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                    직책 <span style={{ color: "#E0301E" }}>*</span>
                  </label>
                  <input id="title" {...register("title")} className="w-full border text-base outline-none" style={inputStyle(!!errors.title)} placeholder="과장" />
                  {errors.title && <p className="text-xs mt-1" style={{ color: "#E0301E" }}>{errors.title.message}</p>}
                </div>
                {/* Phone Office */}
                <div>
                  <label htmlFor="phone_office" className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                    회사전화 <span style={{ color: "#E0301E" }}>*</span>
                  </label>
                  <input id="phone_office" {...register("phone_office")} className="w-full border text-base outline-none" style={inputStyle(!!errors.phone_office)} placeholder="02-1234-5678" />
                  {errors.phone_office && <p className="text-xs mt-1" style={{ color: "#E0301E" }}>{errors.phone_office.message}</p>}
                </div>
                {/* Phone Mobile */}
                <div>
                  <label htmlFor="phone_mobile" className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                    휴대전화 <span style={{ color: "#E0301E" }}>*</span>
                  </label>
                  <input id="phone_mobile" {...register("phone_mobile")} className="w-full border text-base outline-none" style={inputStyle(!!errors.phone_mobile)} placeholder="010-1234-5678" />
                  {errors.phone_mobile && <p className="text-xs mt-1" style={{ color: "#E0301E" }}>{errors.phone_mobile.message}</p>}
                </div>
              </div>
            </fieldset>

            {/* Section: 로그인 정보 */}
            <fieldset>
              <legend
                className="text-base font-bold pb-3 mb-4 w-full"
                style={{
                  color: "#2D2D2D",
                  borderBottom: "1px solid #DEDEDE",
                }}
              >
                로그인 정보
              </legend>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                    이메일 (아이디) <span style={{ color: "#E0301E" }}>*</span>
                  </label>
                  <input id="email" type="email" {...register("email")} className="w-full border text-base outline-none" style={inputStyle(!!errors.email)} placeholder="example@company.com" />
                  {errors.email && <p className="text-xs mt-1" style={{ color: "#E0301E" }}>{errors.email.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                      비밀번호 <span style={{ color: "#E0301E" }}>*</span>
                    </label>
                    <input id="password" type="password" {...register("password")} className="w-full border text-base outline-none" style={inputStyle(!!errors.password)} placeholder="6자 이상" />
                    {errors.password && <p className="text-xs mt-1" style={{ color: "#E0301E" }}>{errors.password.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="password_confirm" className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>
                      비밀번호 확인 <span style={{ color: "#E0301E" }}>*</span>
                    </label>
                    <input id="password_confirm" type="password" {...register("password_confirm")} className="w-full border text-base outline-none" style={inputStyle(!!errors.password_confirm)} placeholder="비밀번호 재입력" />
                    {errors.password_confirm && <p className="text-xs mt-1" style={{ color: "#E0301E" }}>{errors.password_confirm.message}</p>}
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Section: 관심분야 */}
            <fieldset>
              <legend
                className="text-base font-bold pb-3 mb-4 w-full"
                style={{
                  color: "#2D2D2D",
                  borderBottom: "1px solid #DEDEDE",
                }}
              >
                관심분야 <span className="text-xs font-normal" style={{ color: "#7D7D7D" }}>(선택)</span>
              </legend>
              <div className="flex gap-4">
                {(["담보", "무담보"] as const).map((interest) => (
                  <label key={interest} className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#2D2D2D" }}>
                    <input type="checkbox" value={interest} {...register("interests")} className="accent-[#D04A02]" />
                    {interest}
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Section: 약관 동의 */}
            <fieldset>
              <legend
                className="text-base font-bold pb-3 mb-4 w-full"
                style={{
                  color: "#2D2D2D",
                  borderBottom: "1px solid #DEDEDE",
                }}
              >
                약관 동의
              </legend>
              <div className="space-y-3">
                {[
                  { key: "terms_1" as const, label: "이용약관에 동의합니다." },
                  { key: "terms_2" as const, label: "개인정보 수집·이용에 동의합니다." },
                  { key: "terms_3" as const, label: "개인정보 제3자 제공에 동의합니다." },
                ].map((term) => (
                  <div key={term.key}>
                    <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#2D2D2D" }}>
                      <input type="checkbox" {...register(term.key)} className="accent-[#D04A02]" />
                      <span>
                        {term.label} <span style={{ color: "#E0301E" }}>*</span>
                      </span>
                    </label>
                    {errors[term.key] && (
                      <p className="text-xs mt-1 ml-6" style={{ color: "#E0301E" }}>
                        {errors[term.key]?.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </fieldset>

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
              {isSubmitting ? "처리 중..." : "회원가입"}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center text-sm mt-6" style={{ color: "#7D7D7D" }}>
            이미 계정이 있으신가요?{" "}
            <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: "#D04A02" }}>
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
