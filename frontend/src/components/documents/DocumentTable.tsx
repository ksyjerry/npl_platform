"use client";

import type { DocumentItem } from "@/types/document";
import api from "@/lib/api";

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
}

export default function DocumentTable({ items, startIndex }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16" style={{ color: "#7D7D7D" }}>
        등록된 자료가 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth: "900px" }}>
        <thead>
          <tr style={{ backgroundColor: "#2D2D2D" }}>
            {["No", "Pool명", "등록회사명", "등록자", "파일명", "크기", "다운로드", "메모", "등록일"].map((h) => (
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
                  className="text-sm font-medium hover:underline"
                  style={{ color: "#D04A02" }}
                >
                  💾
                </button>
              </td>
              <td className="px-4 py-3" style={{ color: item.memo ? "#2D2D2D" : "#7D7D7D", fontStyle: item.memo ? "normal" : "italic" }}>
                {item.memo || "—"}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDate(item.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
