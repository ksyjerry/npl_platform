"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getAccessToken, setAccessToken, clearAccessToken, parseTokenPayload } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface UserInfo {
  id: number;
  name: string;
  role: string;
  is_verified: boolean;
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tryAuth = async () => {
      let token = getAccessToken();

      // No token in memory — try refresh via cookie
      if (!token) {
        try {
          const res = await api.post("/auth/refresh");
          token = res.data.access_token;
          setAccessToken(token!);
        } catch {
          router.replace("/auth/login");
          return;
        }
      }

      const payload = parseTokenPayload(token!);
      if (!payload) {
        clearAccessToken();
        router.replace("/auth/login");
        return;
      }

      // Check if token is expired
      const exp = payload.exp as number;
      if (exp * 1000 < Date.now()) {
        try {
          const res = await api.post("/auth/refresh");
          token = res.data.access_token;
          setAccessToken(token!);
          const newPayload = parseTokenPayload(token!);
          if (!newPayload) throw new Error();
          setUser({
            id: Number(newPayload.sub),
            name: "",
            role: newPayload.role as string,
            is_verified: true,
          });
        } catch {
          clearAccessToken();
          router.replace("/auth/login");
          return;
        }
        setLoading(false);
        return;
      }

      setUser({
        id: Number(payload.sub),
        name: "",
        role: payload.role as string,
        is_verified: true,
      });
      setLoading(false);
    };

    tryAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{ borderColor: "#DEDEDE", borderTopColor: "#D04A02" }}
        />
      </div>
    );
  }

  // Block pending users
  if (user && user.role === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5F5F5" }}>
        <div
          className="max-w-md mx-4 bg-white border p-8 text-center"
          style={{
            borderColor: "#DEDEDE",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#FFF7ED" }}
          >
            <svg className="w-8 h-8" fill="none" stroke="#C2410C" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: "#2D2D2D" }}
          >
            관리자 인증 대기 중
          </h2>
          <p className="text-sm mb-6" style={{ color: "#7D7D7D" }}>
            관리자 인증이 완료되면 서비스를 이용하실 수 있습니다.
            <br />
            문의사항은 담당자에게 연락해주세요.
          </p>
          <button
            onClick={() => {
              clearAccessToken();
              router.push("/auth/login");
            }}
            className="text-sm font-semibold hover:underline"
            style={{ color: "#D04A02" }}
          >
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-64px)]">{children}</main>
      <Footer />
    </>
  );
}
