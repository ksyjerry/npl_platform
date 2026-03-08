"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/users", label: "회원 관리" },
  { href: "/admin/companies", label: "회사 관리" },
  { href: "/admin/consulting", label: "상담 관리" },
  { href: "/admin/permissions", label: "권한 관리" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <div
      className="flex gap-6 px-8"
      style={{ borderBottom: "1px solid #DEDEDE" }}
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="pb-3 pt-4 text-sm font-semibold transition-colors"
            style={{
              color: isActive ? "#D04A02" : "#7D7D7D",
              borderBottom: isActive
                ? "2px solid #D04A02"
                : "2px solid transparent",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
