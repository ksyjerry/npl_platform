"use client";

import Link from "next/link";
import type { PoolListItem } from "@/types/pool";
import PoolStatusBadge from "./PoolStatusBadge";

function masked(value: string | string[] | null): string {
  if (value === null) return "—";
  if (Array.isArray(value)) return value.join(", ") || "—";
  return value;
}

function formatNumber(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("ko-KR");
}

function formatRatio(value: number | null): string {
  if (value === null) return "—";
  return (value * 100).toFixed(2) + "%";
}

interface Props {
  items: PoolListItem[];
  startIndex: number;
}

export default function PoolTable({ items, startIndex }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16" style={{ color: "#7D7D7D" }}>
        조건에 맞는 Pool이 없습니다.
      </div>
    );
  }

  const columns = [
    { key: "no", label: "No", align: "center" as const },
    { key: "name", label: "Pool명", align: "left" as const },
    { key: "collateral_large", label: "담보유형(대)", align: "center" as const },
    { key: "collateral_small", label: "담보유형(소)", align: "center" as const },
    { key: "cutoff_date", label: "자산확정일", align: "center" as const },
    { key: "bid_date", label: "입찰기일", align: "center" as const },
    { key: "seller_name", label: "양도인", align: "left" as const },
    { key: "buyer_name", label: "양수인", align: "left" as const },
    { key: "opb", label: "OPB(원)", align: "right" as const },
    { key: "sale_ratio", label: "매각가율", align: "right" as const },
    { key: "status", label: "상태", align: "center" as const },
    { key: "detail", label: "상세보기", align: "center" as const },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth: "1000px" }}>
        <thead>
          <tr style={{ backgroundColor: "#2D2D2D" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 font-semibold text-white whitespace-nowrap"
                style={{ textAlign: col.align }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr
              key={item.id}
              style={{
                backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                borderBottom: "1px solid #DEDEDE",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FFF5EE";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA";
              }}
            >
              <td className="px-4 py-3 text-center">{startIndex + idx + 1}</td>
              <td className="px-4 py-3">{item.name}</td>
              <td className="px-4 py-3 text-center" style={item.collateral_large ? {} : { color: "#7D7D7D", fontStyle: "italic" }}>
                {masked(item.collateral_large)}
              </td>
              <td className="px-4 py-3 text-center" style={item.collateral_small ? {} : { color: "#7D7D7D", fontStyle: "italic" }}>
                {masked(item.collateral_small)}
              </td>
              <td className="px-4 py-3 text-center">{masked(item.cutoff_date)}</td>
              <td className="px-4 py-3 text-center">{masked(item.bid_date)}</td>
              <td className="px-4 py-3" style={item.seller_name ? {} : { color: "#7D7D7D", fontStyle: "italic" }}>
                {masked(item.seller_name)}
              </td>
              <td className="px-4 py-3" style={item.buyer_name ? {} : { color: "#7D7D7D", fontStyle: "italic" }}>
                {masked(item.buyer_name)}
              </td>
              <td className="px-4 py-3 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatNumber(item.opb)}
              </td>
              <td className="px-4 py-3 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatRatio(item.sale_ratio)}
              </td>
              <td className="px-4 py-3 text-center">
                <PoolStatusBadge status={item.status} />
              </td>
              <td className="px-4 py-3 text-center">
                {item.can_view_detail ? (
                  <Link
                    href={`/pools/${item.id}`}
                    className="text-sm font-medium hover:underline"
                    style={{ color: "#D04A02" }}
                  >
                    보기
                  </Link>
                ) : (
                  <span style={{ color: "#7D7D7D" }}>—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
