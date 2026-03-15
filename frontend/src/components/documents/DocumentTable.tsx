"use client";

import { useState } from "react";
import type { DocumentItem } from "@/types/document";
import api from "@/lib/api";
import ReasonModal from "@/components/ui/ReasonModal";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function handleDownload(docId: number, fileName: string) {
  try {
    const response = await api.get(`/documents/${docId}/download`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    alert("다운로드에 실패했습니다.");
  }
}

interface Props {
  items: DocumentItem[];
  startIndex: number;
  currentUserId?: number;
  currentUserRole?: string;
  onRefresh?: () => void;
}

export default function DocumentTable({ items, startIndex, currentUserId, currentUserRole, onRefresh }: Props) {
  const [editingMemo, setEditingMemo] = useState<{ id: number; memo: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);

  const canModify = (item: DocumentItem) => {
    if (currentUserRole === "admin" || currentUserRole === "accountant") return true;
    if (currentUserId && item.uploader_id === currentUserId) return true;
    return false;
  };

  const handleMemoSave = async () => {
    if (!editingMemo) return;
    try {
      await api.patch(`/documents/${editingMemo.id}`, {
        reason: "메모 수정",
        memo: editingMemo.memo,
      });
      setEditingMemo(null);
      onRefresh?.();
    } catch {
      alert("메모 수정에 실패했습니다.");
    }
  };

  const handleDelete = async (reason: string) => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/documents/${deleteTarget.id}`, {
        data: { reason },
      });
      setDeleteTarget(null);
      onRefresh?.();
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16" style={{ color: "#7D7D7D" }}>
        등록된 자료가 없습니다.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: "1000px" }}>
          <thead>
            <tr style={{ backgroundColor: "#2D2D2D" }}>
              {["No", "Pool명", "등록회사명", "등록자", "파일명", "크기", "다운로드", "메모", "등록일", "액션"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 font-semibold text-white whitespace-nowrap text-left"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr
                key={item.id}
                style={{ backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA", borderBottom: "1px solid #DEDEDE" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#FFF5EE"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA"; }}
              >
                <td className="px-4 py-3">{startIndex + idx + 1}</td>
                <td className="px-4 py-3">{item.pool_name || "—"}</td>
                <td className="px-4 py-3">{item.company_name || "—"}</td>
                <td className="px-4 py-3">{item.uploader_name || "—"}</td>
                <td className="px-4 py-3">{item.file_name}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatFileSize(item.file_size)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDownload(item.id, item.file_name)}
                    className="text-sm font-medium hover:underline cursor-pointer"
                    style={{ color: "#D04A02" }}
                  >
                    💾
                  </button>
                </td>
                <td className="px-4 py-3" style={{ color: item.memo ? "#2D2D2D" : "#7D7D7D", fontStyle: item.memo ? "normal" : "italic" }}>
                  {editingMemo?.id === item.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingMemo.memo}
                        onChange={(e) => setEditingMemo({ ...editingMemo, memo: e.target.value })}
                        className="border text-sm px-2 py-1 w-32 outline-none"
                        style={{ borderColor: "#D04A02", borderRadius: "4px" }}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") handleMemoSave(); if (e.key === "Escape") setEditingMemo(null); }}
                      />
                      <button onClick={handleMemoSave} className="text-xs px-1" style={{ color: "#D04A02" }}>저장</button>
                      <button onClick={() => setEditingMemo(null)} className="text-xs px-1" style={{ color: "#7D7D7D" }}>취소</button>
                    </div>
                  ) : (
                    item.memo || "—"
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(item.created_at)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {canModify(item) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingMemo({ id: item.id, memo: item.memo || "" })}
                        className="text-xs hover:underline"
                        style={{ color: "#D04A02" }}
                      >
                        메모수정
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="text-xs hover:underline"
                        style={{ color: "#E0301E" }}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <ReasonModal
          isOpen
          title="자료 삭제"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
