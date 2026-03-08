"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import RoleGuard from "@/components/auth/RoleGuard";
import AdminNav from "@/components/admin/AdminNav";

interface ConsultingItem {
  id: number;
  type: string;       // "selling" | "buying"
  name: string;
  position?: string;
  email: string;
  user_name: string;
  company_name?: string;
  title: string;
  content: string;
  reply?: string;
  status: string;     // "pending" | "replied"
  created_at: string;
}

interface PaginatedResponse {
  items: ConsultingItem[];
  total: number;
  page: number;
  size: number;
}

const TYPE_LABELS: Record<string, string> = {
  selling: "매각 상담",
  buying: "인수 상담",
};

const TAB_OPTIONS = [
  { value: "", label: "전체" },
  { value: "selling", label: "매각 상담" },
  { value: "buying", label: "인수 상담" },
];

// AdminNav is imported from shared component

function ConsultingPageContent() {
  const [items, setItems] = useState<ConsultingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  // Reply modal
  const [selectedItem, setSelectedItem] = useState<ConsultingItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [readOnly, setReadOnly] = useState(false);

  const [error, setError] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = { page, size: pageSize };
      if (filterType) params.type = filterType;
      const res = await api.get("/admin/consulting", { params });
      const data: PaginatedResponse = res.data;
      setItems(data.items);
      setTotal(data.total);
    } catch {
      setError("상담 목록을 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, [page, filterType]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openReply = (item: ConsultingItem) => {
    setSelectedItem(item);
    if (item.status === "replied") {
      setReplyText(item.reply || "");
      setReadOnly(true);
    } else {
      setReplyText("");
      setReadOnly(false);
    }
  };

  const closeModal = () => {
    setSelectedItem(null);
    setReplyText("");
    setReadOnly(false);
  };

  const handleReply = async () => {
    if (!selectedItem || !replyText.trim()) return;
    setReplying(true);
    try {
      await api.post(`/admin/consulting/${selectedItem.id}/reply`, {
        reply: replyText,
      });
      closeModal();
      await fetchItems();
    } catch {
      setError("답변 등록에 실패했습니다.");
    } finally {
      setReplying(false);
    }
  };

  const formatDate = (d: string) => d.slice(0, 10);

  return (
    <div>
      {/* Title */}
      <div
        className="px-8 py-5"
        style={{ borderBottom: "1px solid #DEDEDE" }}
      >
        <h2 className="text-xl font-bold" style={{ color: "#2D2D2D" }}>
          상담 관리
        </h2>
      </div>

      {/* Type tabs */}
      <div className="px-8 pt-4 flex gap-4">
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setFilterType(tab.value);
              setPage(1);
            }}
            className="px-4 py-2 text-sm font-semibold transition-colors border"
            style={{
              borderColor: filterType === tab.value ? "#D04A02" : "#DEDEDE",
              color: filterType === tab.value ? "#D04A02" : "#464646",
              backgroundColor:
                filterType === tab.value ? "#FFF5EE" : "transparent",
              borderRadius: "4px",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          className="mx-8 mt-4 px-4 py-3 text-sm"
          style={{
            backgroundColor: "#FEF2F2",
            color: "#DC2626",
            borderRadius: "4px",
            border: "1px solid #FECACA",
          }}
        >
          {error}
          <button
            className="ml-4 underline"
            onClick={() => setError("")}
          >
            닫기
          </button>
        </div>
      )}

      {/* Table */}
      <div className="px-8 py-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div
              className="w-8 h-8 border-4 rounded-full animate-spin"
              style={{ borderColor: "#DEDEDE", borderTopColor: "#D04A02" }}
            />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: "#7D7D7D" }}>
            등록된 상담이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#2D2D2D" }}>
                  {[
                    "No",
                    "상담유형",
                    "성함",
                    "직책",
                    "이메일",
                    "제목",
                    "신청일",
                    "처리상태",
                    "보기",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-semibold text-white"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr
                    key={item.id}
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
                    <td className="px-4 py-3">
                      {(page - 1) * pageSize + i + 1}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#464646" }}>
                      {TYPE_LABELS[item.type] || item.type}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#2D2D2D" }}>
                      {item.name}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#464646" }}>
                      {item.position || "-"}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#464646" }}>
                      {item.email}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#2D2D2D" }}>
                      {item.title}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#464646" }}>
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {item.status === "replied" ? (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                          style={{
                            backgroundColor: "#F0FDF4",
                            color: "#166534",
                            borderColor: "#BBF7D0",
                          }}
                        >
                          답변 완료
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                          style={{
                            backgroundColor: "#FFF7ED",
                            color: "#C2410C",
                            borderColor: "#FED7AA",
                          }}
                        >
                          답변 대기
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openReply(item)}
                        className="text-sm hover:underline"
                        style={{ color: "#D04A02" }}
                      >
                        상담 보기
                      </button>
                    </td>
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

      {/* Reply Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="bg-white w-full max-w-[520px] mx-4"
            style={{
              borderRadius: "4px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
          >
            {/* Header */}
            <div
              className="px-6 pt-6 pb-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid #DEDEDE" }}
            >
              <h3 className="text-lg font-bold" style={{ color: "#2D2D2D" }}>
                상담 보기
              </h3>
              <button
                onClick={closeModal}
                className="text-lg hover:opacity-70"
                style={{ color: "#7D7D7D" }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* 신청자 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>성함</label>
                  <div className="w-full border text-sm px-3 py-2" style={{ borderColor: "#DEDEDE", borderRadius: "4px", color: "#464646", backgroundColor: "#F5F5F5" }}>
                    {selectedItem.name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>직책</label>
                  <div className="w-full border text-sm px-3 py-2" style={{ borderColor: "#DEDEDE", borderRadius: "4px", color: "#464646", backgroundColor: "#F5F5F5" }}>
                    {selectedItem.position || "-"}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#2D2D2D" }}>이메일</label>
                <div className="w-full border text-sm px-3 py-2" style={{ borderColor: "#DEDEDE", borderRadius: "4px", color: "#464646", backgroundColor: "#F5F5F5" }}>
                  {selectedItem.email}
                </div>
              </div>

              {/* Title */}
              <div>
                <label
                  className="block text-sm font-semibold mb-1"
                  style={{ color: "#2D2D2D" }}
                >
                  문의 제목
                </label>
                <div
                  className="w-full border text-sm px-3 py-2"
                  style={{
                    borderColor: "#DEDEDE",
                    borderRadius: "4px",
                    color: "#464646",
                    backgroundColor: "#F5F5F5",
                  }}
                >
                  {selectedItem.title}
                </div>
              </div>

              {/* Content */}
              <div>
                <label
                  className="block text-sm font-semibold mb-1"
                  style={{ color: "#2D2D2D" }}
                >
                  문의 내용
                </label>
                <div
                  className="w-full border text-sm px-3 py-2 whitespace-pre-wrap"
                  style={{
                    borderColor: "#DEDEDE",
                    borderRadius: "4px",
                    color: "#464646",
                    backgroundColor: "#F5F5F5",
                    minHeight: "80px",
                  }}
                >
                  {selectedItem.content}
                </div>
              </div>

              {/* Reply */}
              <div>
                <label
                  className="block text-sm font-semibold mb-1"
                  style={{ color: "#2D2D2D" }}
                >
                  답변
                </label>
                {readOnly ? (
                  <div
                    className="w-full border text-sm px-3 py-2 whitespace-pre-wrap"
                    style={{
                      borderColor: "#DEDEDE",
                      borderRadius: "4px",
                      color: "#464646",
                      backgroundColor: "#F5F5F5",
                      minHeight: "80px",
                    }}
                  >
                    {replyText}
                  </div>
                ) : (
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="답변을 입력해주세요."
                    className="w-full border text-sm outline-none resize-none"
                    rows={4}
                    style={{
                      borderColor: "#DEDEDE",
                      borderRadius: "4px",
                      padding: "10px 14px",
                      color: "#2D2D2D",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#D04A02";
                      e.target.style.boxShadow =
                        "0 0 0 2px rgba(208,74,2,0.2)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#DEDEDE";
                      e.target.style.boxShadow = "none";
                    }}
                    autoFocus
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-6 pb-6 pt-4 flex justify-end gap-3"
              style={{ borderTop: "1px solid #DEDEDE" }}
            >
              {readOnly ? (
                <button
                  onClick={closeModal}
                  className="px-6 py-2 text-sm font-semibold text-white transition-colors"
                  style={{
                    backgroundColor: "#D04A02",
                    borderRadius: "4px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#EB8C00")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#D04A02")
                  }
                >
                  닫기
                </button>
              ) : (
                <>
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-semibold border-2 transition-colors"
                    style={{
                      borderColor: "#D04A02",
                      color: "#D04A02",
                      borderRadius: "4px",
                    }}
                  >
                    취소
                  </button>
                  <button
                    disabled={!replyText.trim() || replying}
                    onClick={handleReply}
                    className="px-4 py-2 text-sm font-semibold text-white transition-colors"
                    style={{
                      backgroundColor:
                        replyText.trim() && !replying
                          ? "#D04A02"
                          : "rgba(208,74,2,0.4)",
                      borderRadius: "4px",
                      cursor:
                        replyText.trim() && !replying
                          ? "pointer"
                          : "not-allowed",
                    }}
                  >
                    {replying ? "등록 중..." : "답변 등록"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminConsultingPage() {
  return (
    <RoleGuard permission="admin:access">
      <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
        <AdminNav />
        <ConsultingPageContent />
      </div>
    </RoleGuard>
  );
}
