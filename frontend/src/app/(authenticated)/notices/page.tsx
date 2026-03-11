"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useNotices } from "@/hooks/useNotices";
import { can } from "@/lib/rbac";
import { getAccessToken, parseTokenPayload } from "@/lib/auth";

export default function NoticesPage() {
  const { items, total, page, setPage, loading } = useNotices();
  const [role, setRole] = useState("");
  const totalPages = Math.ceil(total / 20);

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const payload = parseTokenPayload(token);
      if (payload) setRole(payload.role as string);
    }
  }, []);

  const formatDate = (d: string) => d.slice(0, 10);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Title bar */}
      <div
        className="px-8 py-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid #DEDEDE" }}
      >
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#2D2D2D" }}>
            공지사항
          </h1>
          <p className="text-sm mt-1" style={{ color: "#7D7D7D" }}>
            플랫폼 공지사항 및 거래 관련 안내를 확인할 수 있습니다.
          </p>
        </div>
        {can(role, "notice:create") && (
          <Link
            href="/notices/create"
            className="text-sm font-semibold text-white"
            style={{
              backgroundColor: "#D04A02",
              borderRadius: "4px",
              padding: "8px 16px",
            }}
          >
            + 공지 등록
          </Link>
        )}
      </div>

      {/* Table */}
      <div className="px-8 py-6">
        {loading ? (
          <div className="text-center py-16" style={{ color: "#7D7D7D" }}>
            로딩 중...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16" style={{ color: "#7D7D7D" }}>
            등록된 공지사항이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#2D2D2D" }}>
                  {["No", "구분", "제목", "첨부", "등록자", "등록일"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-semibold text-white"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((n, i) => (
                  <tr
                    key={n.id}
                    className="transition-colors"
                    style={{
                      backgroundColor: i % 2 === 1 ? "#FAFAFA" : "#FFFFFF",
                      borderBottom: "1px solid #DEDEDE",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#FFF5EE")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        i % 2 === 1 ? "#FAFAFA" : "#FFFFFF")
                    }
                  >
                    <td className="px-4 py-3">{(page - 1) * 20 + i + 1}</td>
                    <td className="px-4 py-3">{n.category}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/notices/${n.id}`}
                        className="hover:underline"
                        style={{ color: "#2D2D2D" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "#D04A02")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "#2D2D2D")
                        }
                      >
                        {n.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {n.has_attachment && (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="#7D7D7D"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                          />
                        </svg>
                      )}
                    </td>
                    <td className="px-4 py-3">{n.created_by_name}</td>
                    <td className="px-4 py-3">{formatDate(n.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-end gap-2 mt-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="px-3 py-1 text-sm border"
                style={{
                  borderColor: p === page ? "#D04A02" : "#DEDEDE",
                  color: p === page ? "#D04A02" : "#464646",
                  backgroundColor: p === page ? "#FFF5EE" : "transparent",
                  borderRadius: "4px",
                  fontWeight: p === page ? 600 : 400,
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
