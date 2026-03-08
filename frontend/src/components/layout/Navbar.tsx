"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getAccessToken, clearAccessToken, parseTokenPayload } from "@/lib/auth";

/* ── Menu Data ──────────────────────────────────────────── */

interface NavChild {
  href: string;
  label: string;
  /** If true, only show when user is logged in */
  authOnly?: boolean;
}

interface NavItem {
  label: string;
  /** Direct link (no dropdown) — set href */
  href?: string;
  /** Dropdown children — set children */
  children?: NavChild[];
  /** Paths that trigger active highlight for this menu group */
  activePaths?: string[];
  /** If true, only show when user is logged in */
  authOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "홈",
    href: "/",
  },
  {
    label: "서비스 소개",
    activePaths: ["/service"],
    children: [
      { href: "/service/selling", label: "매각 자문" },
      { href: "/service/buying", label: "인수 자문" },
    ],
  },
  {
    label: "거래정보",
    activePaths: ["/notices", "/pools", "/documents"],
    authOnly: true,
    children: [
      { href: "/notices", label: "공지사항" },
      { href: "/pools", label: "거래현황" },
      { href: "/documents", label: "자료등록" },
    ],
  },
  {
    label: "고객지원",
    activePaths: ["/support"],
    children: [
      { href: "/support/guide", label: "이용가이드" },
      { href: "/support/glossary", label: "용어사전" },
      { href: "/support/faq", label: "FAQ" },
    ],
  },
];

/* ── Component ──────────────────────────────────────────── */

const ROLE_LABELS: Record<string, string> = {
  admin: "관리자",
  accountant: "회계법인",
  seller: "매도인",
  buyer: "매수인",
};

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const payload = parseTokenPayload(token);
      if (payload) {
        setUser({
          name: (payload.name as string) || "",
          role: payload.role as string,
        });
      }
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isPathActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isGroupActive = (item: NavItem) => {
    if (item.href) return isPathActive(item.href);
    if (item.activePaths) return item.activePaths.some((p) => pathname.startsWith(p));
    if (item.children) return item.children.some((c) => isPathActive(c.href));
    return false;
  };

  const filterChildren = (children: NavChild[]) =>
    children.filter((c) => {
      if (c.authOnly && !user) return false;
      return true;
    });

  const handleLogout = () => {
    clearAccessToken();
    window.location.href = "/auth/login";
  };

  const toggleDropdown = (label: string) => {
    setOpenDropdown((prev) => (prev === label ? null : label));
  };

  return (
    <nav
      className="sticky top-0 z-50 bg-white"
      style={{ height: "64px", borderBottom: "1px solid #DEDEDE" }}
    >
      <div
        ref={navRef}
        className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between"
      >
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/pwc-logo.png"
            alt="PwC"
            width={64}
            height={32}
            style={{ objectFit: "contain" }}
            priority
          />
          <span className="text-lg font-bold" style={{ color: "#2D2D2D" }}>
            NPL Platform
          </span>
        </Link>

        {/* Center: Nav links (desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => {
            // Hide authOnly menus when not logged in
            if (item.authOnly && !user) return null;

            const active = isGroupActive(item);

            // Simple link (no dropdown)
            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm transition-colors"
                  style={{
                    color: active ? "#D04A02" : "#464646",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {item.label}
                </Link>
              );
            }

            // Dropdown
            const visibleChildren = filterChildren(item.children || []);
            if (visibleChildren.length === 0) return null;
            const isOpen = openDropdown === item.label;

            return (
              <div key={item.label} className="relative">
                <button
                  onClick={() => toggleDropdown(item.label)}
                  className="text-sm transition-colors flex items-center gap-1"
                  style={{
                    color: active ? "#D04A02" : "#464646",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {item.label}
                  <svg
                    className="w-3.5 h-3.5 transition-transform"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 bg-white border py-2"
                    style={{
                      borderColor: "#DEDEDE",
                      borderRadius: "4px",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                      minWidth: "160px",
                    }}
                  >
                    {visibleChildren.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
                        style={{
                          color: isPathActive(child.href) ? "#D04A02" : "#464646",
                          fontWeight: isPathActive(child.href) ? 600 : 400,
                        }}
                        onClick={() => setOpenDropdown(null)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Auth */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              {user.role === "admin" && (
                <Link
                  href="/admin/users"
                  className="text-sm font-medium"
                  style={{ color: "#D04A02" }}
                >
                  관리자페이지
                </Link>
              )}
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "#FFF7ED",
                  color: "#C2410C",
                  border: "1px solid #FED7AA",
                }}
              >
                {ROLE_LABELS[user.role] || user.role}
              </span>
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="text-sm font-medium flex items-center gap-1"
                  style={{ color: "#2D2D2D" }}
                >
                  {user.name ? `${user.name}님` : "사용자님"}
                  <svg
                    className="w-3.5 h-3.5 transition-transform"
                    style={{ transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div
                    className="absolute top-full right-0 mt-2 bg-white border py-2"
                    style={{
                      borderColor: "#DEDEDE",
                      borderRadius: "4px",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                      minWidth: "140px",
                    }}
                  >
                    <Link
                      href="/mypage"
                      className="block px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
                      style={{ color: "#464646" }}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      마이페이지
                    </Link>
                    <button
                      onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                      className="block w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
                      style={{ color: "#7D7D7D" }}
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-semibold"
                style={{ color: "#2D2D2D" }}
              >
                로그인
              </Link>
              <Link
                href="/auth/register"
                className="text-sm font-semibold"
                style={{ color: "#2D2D2D" }}
              >
                회원가입
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="메뉴"
        >
          <svg className="w-6 h-6" fill="none" stroke="#2D2D2D" strokeWidth={2} viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t" style={{ borderColor: "#DEDEDE" }}>
          <div className="px-8 py-4 flex flex-col gap-3">
            {NAV_ITEMS.map((item) => {
              if (item.authOnly && !user) return null;

              const active = isGroupActive(item);

              // Simple link
              if (item.href) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm py-2"
                    style={{
                      color: active ? "#D04A02" : "#464646",
                      fontWeight: active ? 600 : 400,
                    }}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              }

              // Dropdown → inline children on mobile
              const visibleChildren = filterChildren(item.children || []);
              if (visibleChildren.length === 0) return null;

              return (
                <div key={item.label} className="flex flex-col gap-1">
                  <span
                    className="text-sm py-2 font-semibold"
                    style={{ color: active ? "#D04A02" : "#464646" }}
                  >
                    {item.label}
                  </span>
                  {visibleChildren.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="text-sm py-1.5 pl-4"
                      style={{
                        color: isPathActive(child.href) ? "#D04A02" : "#464646",
                        fontWeight: isPathActive(child.href) ? 600 : 400,
                      }}
                      onClick={() => setMenuOpen(false)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              );
            })}

            {/* Auth section */}
            <div className="border-t pt-4" style={{ borderColor: "#DEDEDE" }}>
              {user ? (
                <div className="flex flex-col gap-3">
                  {user.role === "admin" && (
                    <Link
                      href="/admin/users"
                      className="text-sm"
                      style={{ color: "#D04A02" }}
                      onClick={() => setMenuOpen(false)}
                    >
                      관리자페이지
                    </Link>
                  )}
                  <Link
                    href="/mypage"
                    className="text-sm"
                    style={{ color: "#464646" }}
                    onClick={() => setMenuOpen(false)}
                  >
                    마이페이지
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-left"
                    style={{ color: "#7D7D7D" }}
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/auth/login"
                    className="text-sm font-semibold"
                    style={{ color: "#2D2D2D" }}
                    onClick={() => setMenuOpen(false)}
                  >
                    로그인
                  </Link>
                  <Link
                    href="/auth/register"
                    className="text-sm font-semibold"
                    style={{ color: "#2D2D2D" }}
                    onClick={() => setMenuOpen(false)}
                  >
                    회원가입
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
