"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { usePoolDetail } from "@/hooks/usePools";
import PoolDetailForm from "@/components/pools/PoolDetailForm";
import PoolDocumentSection from "@/components/pools/PoolDocumentSection";
import { parseTokenPayload, getAccessToken } from "@/lib/auth";
import { can } from "@/lib/rbac";
import ExcelJS from "exceljs";
import BondDetailModal from "@/components/bonds/BondDetailModal";
import { BOND_TYPE_COLUMNS, type BondColumnDef } from "@/lib/bond-columns";

const TABS = [
  { value: "info", label: "거래 정보" },
  { value: "documents", label: "거래 자료" },
  { value: "bonds", label: "채권 정보" },
];

export default function PoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const poolId = parseInt(id, 10);
  const { pool, loading, error, refresh } = usePoolDetail(poolId);
  const [activeTab, setActiveTab] = useState("info");

  // Get current user role from token
  const token = getAccessToken();
  const payload = token ? parseTokenPayload(token) : null;
  const userRole = (payload?.role as string) || "";
  const canEdit = can(userRole, "pool:write");

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2" style={{ color: "#E0301E" }}>
            {error}
          </p>
          <Link
            href="/pools"
            className="text-sm font-medium hover:underline"
            style={{ color: "#D04A02" }}
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!pool) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      {/* Breadcrumb */}
      <div
        className="px-8 py-3 text-sm"
        style={{ backgroundColor: "#F5F5F5", borderBottom: "1px solid #DEDEDE", color: "#7D7D7D" }}
      >
        <Link href="/pools" className="hover:underline" style={{ color: "#7D7D7D" }}>
          거래현황
        </Link>
        <span className="mx-2">{">"}</span>
        <span style={{ color: "#2D2D2D" }}>{pool.name}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 px-8" style={{ borderBottom: "1px solid #DEDEDE" }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="pb-3 pt-4 text-sm font-semibold transition-colors cursor-pointer"
              style={{
                color: isActive ? "#D04A02" : "#7D7D7D",
                borderBottom: isActive ? "2px solid #D04A02" : "2px solid transparent",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className={`mx-auto px-8 py-8 ${activeTab === "info" ? "max-w-4xl" : ""}`}>
        {activeTab === "info" && (
          <PoolDetailForm pool={pool} canEdit={canEdit} onUpdated={refresh} />
        )}
        {activeTab === "documents" && (
          <PoolDocumentSection poolId={poolId} canUpload={canEdit} />
        )}
        {activeTab === "bonds" && (
          <BondSummarySection poolId={poolId} poolName={pool.name} />
        )}
      </div>
    </div>
  );
}

// Types for matrix summary
interface MatrixCell {
  debtor_count: number;
  bond_count: number;
  opb: number;
}

interface MatrixRow {
  creditor: string;
  by_debtor_type: Record<string, MatrixCell>;
  total: MatrixCell;
}

interface MatrixSection {
  bond_type: string;
  bond_type_label: string;
  rows: MatrixRow[];
  total: MatrixRow;
}

interface BondSummaryData {
  total_bond_count: number;
  total_debtor_count: number;
  total_opb: number;
  total_balance: number;
  matrix: MatrixSection[];
}

const DEBTOR_TYPE_COLS = ["개인", "개인사업자", "법인"];

interface BondDetail {
  id: number;
  bond_type: string | null;
  bond_no: string | null;
  debtor_type: string | null;
  debtor_id_masked: string | null;
  creditor: string | null;
  product_type: string | null;
  collateral_type: string | null;
  collateral_address: string | null;
  original_amount: number | null;
  opb: number | null;
  interest_balance: number | null;
  total_balance: number | null;
  overdue_start_date: string | null;
  overdue_months: number | null;
  legal_status: string | null;
  transfer_count: number | null;
  extra_data?: Record<string, unknown> | null;
}

const BOND_TYPE_LABELS: Record<string, string> = {
  A: "일반무담보채권",
  B1: "채무조정채권(CCRS)",
  B2: "채무조정채권(IRL)",
  C: "담보채권",
};

// ── Design tokens for Excel styling ──
const XL_COLORS = {
  primary: "D04A02",      // PwC orange
  headerBg: "2D2D2D",     // dark header
  headerFont: "FFFFFF",
  subHeaderBg: "F5F5F5",
  totalBg: "FFF3E0",
  titleFont: "2D2D2D",
  border: "DEDEDE",
  zebraLight: "FFFFFF",
  zebraDark: "FAFAFA",
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: XL_COLORS.border } },
  bottom: { style: "thin", color: { argb: XL_COLORS.border } },
  left: { style: "thin", color: { argb: XL_COLORS.border } },
  right: { style: "thin", color: { argb: XL_COLORS.border } },
};

const NUM_FMT_KRW = "#,##0";

function applyHeaderRow(row: ExcelJS.Row, colCount: number) {
  row.height = 28;
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber > colCount) return;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: XL_COLORS.headerBg } };
    cell.font = { bold: true, size: 10, color: { argb: XL_COLORS.headerFont } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = THIN_BORDER;
  });
}

function applyDataRow(row: ExcelJS.Row, colCount: number, isEven: boolean) {
  row.height = 22;
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber > colCount) return;
    cell.fill = {
      type: "pattern", pattern: "solid",
      fgColor: { argb: isEven ? XL_COLORS.zebraDark : XL_COLORS.zebraLight },
    };
    cell.font = { size: 10, color: { argb: XL_COLORS.titleFont } };
    cell.alignment = { vertical: "middle" };
    cell.border = THIN_BORDER;
  });
}

function applyTotalRow(row: ExcelJS.Row, colCount: number) {
  row.height = 26;
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber > colCount) return;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: XL_COLORS.totalBg } };
    cell.font = { bold: true, size: 10, color: { argb: XL_COLORS.titleFont } };
    cell.alignment = { vertical: "middle" };
    cell.border = THIN_BORDER;
  });
}

/** Column letter from 1-based index (1→A, 27→AA, etc.) */
function colLetter(idx: number): string {
  let s = "";
  let n = idx;
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

async function buildExcel(summary: BondSummaryData, bonds: BondDetail[], poolName: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "삼일PwC NPL 플랫폼";

  // ── Create summary sheet first (so it appears as the first tab) ──
  const ws1 = wb.addWorksheet("채권요약", {
    properties: { tabColor: { argb: XL_COLORS.primary } },
  });

  // ── Raw data sheets ──
  const commonHeaders = [
    "No", "채권번호", "차주구분", "차주ID(마스킹)",
    "금융회사명", "상품유형", "담보유형", "담보소재지",
    "원금", "OPB", "이자잔액", "합계잔액",
    "연체시작일", "연체기간(월)", "법적상태", "양도횟수",
  ];
  const numericCommonCols = new Set([0, 8, 9, 10, 11, 13, 15]); // 0-based indices that are numeric

  const typeSheetNames: Record<string, string> = { A: "일반무담보", B1: "CCRS", B2: "IRL", C: "담보" };

  // Group bonds by type
  const bondsByType: Record<string, BondDetail[]> = {};
  for (const b of bonds) {
    const bt = b.bond_type || "A";
    if (!bondsByType[bt]) bondsByType[bt] = [];
    bondsByType[bt].push(b);
  }

  // Track sheet info for formula references
  const sheetInfo: Record<string, { sheetName: string; startRow: number; endRow: number; credCol: string; dtCol: string; opbCol: string; debtorIdCol: string; bondNoCol: string }> = {};

  for (const bt of ["A", "B1", "B2", "C"]) {
    const typeBonds = bondsByType[bt];
    if (!typeBonds || typeBonds.length === 0) continue;

    const extraCols: BondColumnDef[] = BOND_TYPE_COLUMNS[bt] || [];
    const allHeaders = [...commonHeaders, ...extraCols.map((c) => c.key)];
    const sheetName = typeSheetNames[bt] || bt;
    const ws = wb.addWorksheet(sheetName);

    // Column widths
    ws.columns = allHeaders.map((h, i) => ({
      width: i === 0 ? 6 : numericCommonCols.has(i) ? 16 : Math.min(Math.max(h.length * 2, 12), 22),
    }));

    // Header
    const hRow = ws.addRow(allHeaders);
    applyHeaderRow(hRow, allHeaders.length);
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: allHeaders.length } };

    // Data rows
    typeBonds.forEach((b, i) => {
      const commonRow: unknown[] = [
        i + 1, b.bond_no || "", b.debtor_type || "", b.debtor_id_masked || "",
        b.creditor || "", b.product_type || "", b.collateral_type || "", b.collateral_address || "",
        b.original_amount, b.opb, b.interest_balance, b.total_balance,
        b.overdue_start_date || "", b.overdue_months, b.legal_status || "", b.transfer_count,
      ];
      const extraRow = extraCols.map((col) => {
        const v = b.extra_data?.[col.key];
        if (v === null || v === undefined) return "";
        return v;
      });
      const row = ws.addRow([...commonRow, ...extraRow]);
      applyDataRow(row, allHeaders.length, i % 2 === 0);

      // Number formatting for numeric columns
      for (const ci of numericCommonCols) {
        const cell = row.getCell(ci + 1);
        if (typeof cell.value === "number") cell.numFmt = NUM_FMT_KRW;
      }
      // Extra numeric cols
      extraCols.forEach((col, ei) => {
        if (col.type === "number") {
          const cell = row.getCell(commonHeaders.length + ei + 1);
          if (typeof cell.value === "number") cell.numFmt = NUM_FMT_KRW;
        }
      });
    });

    sheetInfo[bt] = {
      sheetName,
      startRow: 2,
      endRow: 1 + typeBonds.length,
      credCol: "E",                  // 금융회사명
      dtCol: colLetter(3),           // 차주구분 = C
      opbCol: colLetter(10),         // OPB = J
      debtorIdCol: colLetter(4),     // 차주ID = D
      bondNoCol: "B",                // 채권번호
    };
  }

  // ── Populate summary sheet ──
  ws1.columns = [
    { width: 22 }, // A: label
    ...Array(12).fill(null).map(() => ({ width: 15 })),
  ];

  // Helper: build a full range string like '일반무담보'!E2:E77
  const ref = (sn: string, col: string, r1: number, r2: number) =>
    `'${sn}'!${col}${r1}:${col}${r2}`;

  // Title
  let r = 1;
  ws1.mergeCells(r, 1, r, 13);
  const titleCell = ws1.getCell(r, 1);
  titleCell.value = `${poolName} — 채권 요약`;
  titleCell.font = { bold: true, size: 16, color: { argb: XL_COLORS.titleFont } };
  titleCell.alignment = { horizontal: "left", vertical: "middle" };
  ws1.getRow(r).height = 36;

  r += 1; // blank row

  // ── Top-level totals ──
  r += 1;
  const sheets = Object.values(sheetInfo);
  const labelStyle = { font: { bold: true, size: 11, color: { argb: "7D7D7D" } } };
  const valueStyle = { font: { bold: true, size: 14, color: { argb: XL_COLORS.titleFont } }, numFmt: NUM_FMT_KRW };

  // 총 차주수
  ws1.getCell(r, 1).value = "총 차주수";
  Object.assign(ws1.getCell(r, 1), labelStyle);
  ws1.getCell(r, 2).value = {
    formula: sheets.map((s) => `COUNTA(${ref(s.sheetName, s.debtorIdCol, s.startRow, s.endRow)})`).join("+"),
  };
  Object.assign(ws1.getCell(r, 2), valueStyle);
  ws1.getRow(r).height = 28;

  r += 1;
  // 총 채권수
  ws1.getCell(r, 1).value = "총 채권수";
  Object.assign(ws1.getCell(r, 1), labelStyle);
  ws1.getCell(r, 2).value = {
    formula: sheets.map((s) => `COUNTA(${ref(s.sheetName, s.bondNoCol, s.startRow, s.endRow)})`).join("+"),
  };
  Object.assign(ws1.getCell(r, 2), valueStyle);
  ws1.getRow(r).height = 28;

  r += 1;
  // 총 OPB
  ws1.getCell(r, 1).value = "총 OPB";
  Object.assign(ws1.getCell(r, 1), labelStyle);
  ws1.getCell(r, 2).value = {
    formula: sheets.map((s) => `SUM(${ref(s.sheetName, s.opbCol, s.startRow, s.endRow)})`).join("+"),
  };
  Object.assign(ws1.getCell(r, 2), valueStyle);
  ws1.getRow(r).height = 28;

  r += 2; // blank

  // ── Matrix sections ──
  for (const section of summary.matrix) {
    const bt = section.bond_type;
    const si = sheetInfo[bt];
    if (!si) continue;
    const sn = si.sheetName;

    // Section title
    ws1.mergeCells(r, 1, r, 13);
    const secTitle = ws1.getCell(r, 1);
    secTitle.value = section.bond_type_label;
    secTitle.font = { bold: true, size: 12, color: { argb: XL_COLORS.primary } };
    secTitle.border = { bottom: { style: "medium", color: { argb: XL_COLORS.primary } } };
    ws1.getRow(r).height = 30;
    r += 1;

    // Header row 1: merged groups
    const h1Row = ws1.getRow(r);
    ws1.getCell(r, 1).value = "매도인(금융회사)";
    for (let di = 0; di < DEBTOR_TYPE_COLS.length; di++) {
      const startCol = 2 + di * 3;
      ws1.mergeCells(r, startCol, r, startCol + 2);
      ws1.getCell(r, startCol).value = DEBTOR_TYPE_COLS[di];
      ws1.getCell(r, startCol).alignment = { horizontal: "center", vertical: "middle" };
    }
    const totalStartCol = 2 + DEBTOR_TYPE_COLS.length * 3;
    ws1.mergeCells(r, totalStartCol, r, totalStartCol + 2);
    ws1.getCell(r, totalStartCol).value = "합계";
    ws1.getCell(r, totalStartCol).alignment = { horizontal: "center", vertical: "middle" };
    ws1.mergeCells(r, 1, r + 1, 1); // merge A label across 2 rows
    applyHeaderRow(h1Row, 13);
    r += 1;

    // Header row 2: sub-headers
    const h2Row = ws1.getRow(r);
    ws1.getCell(r, 1).value = "";
    for (let i = 0; i < DEBTOR_TYPE_COLS.length + 1; i++) {
      const base = 2 + i * 3;
      ws1.getCell(r, base).value = "차주수";
      ws1.getCell(r, base + 1).value = "채권수";
      ws1.getCell(r, base + 2).value = "OPB";
    }
    h2Row.height = 24;
    h2Row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber > 13) return;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: XL_COLORS.subHeaderBg } };
      cell.font = { bold: true, size: 9, color: { argb: "464646" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = THIN_BORDER;
    });
    r += 1;

    // Data rows (creditor rows) — COUNTIFS/SUMIFS referencing raw data sheet
    const creditors = section.rows.map((row) => row.creditor);
    const dataRowStart = r;

    // Ranges for this sheet (column+rows, e.g. "E2:E77")
    const credRange = ref(sn, si.credCol, si.startRow, si.endRow);
    const dtRange = ref(sn, si.dtCol, si.startRow, si.endRow);
    const opbRange = ref(sn, si.opbCol, si.startRow, si.endRow);

    for (const cred of creditors) {
      ws1.getCell(r, 1).value = cred;
      ws1.getCell(r, 1).font = { size: 10, color: { argb: XL_COLORS.titleFont } };
      ws1.getCell(r, 1).border = THIN_BORDER;

      for (let di = 0; di < DEBTOR_TYPE_COLS.length; di++) {
        const dt = DEBTOR_TYPE_COLS[di];
        const base = 2 + di * 3;

        // 차주수
        ws1.getCell(r, base).value = {
          formula: `COUNTIFS(${credRange},"${cred}",${dtRange},"${dt}")`,
        };
        ws1.getCell(r, base).numFmt = NUM_FMT_KRW;
        ws1.getCell(r, base).border = THIN_BORDER;
        ws1.getCell(r, base).alignment = { horizontal: "right" };

        // 채권수
        ws1.getCell(r, base + 1).value = {
          formula: `COUNTIFS(${credRange},"${cred}",${dtRange},"${dt}")`,
        };
        ws1.getCell(r, base + 1).numFmt = NUM_FMT_KRW;
        ws1.getCell(r, base + 1).border = THIN_BORDER;
        ws1.getCell(r, base + 1).alignment = { horizontal: "right" };

        // OPB
        ws1.getCell(r, base + 2).value = {
          formula: `SUMIFS(${opbRange},${credRange},"${cred}",${dtRange},"${dt}")`,
        };
        ws1.getCell(r, base + 2).numFmt = NUM_FMT_KRW;
        ws1.getCell(r, base + 2).border = THIN_BORDER;
        ws1.getCell(r, base + 2).alignment = { horizontal: "right" };
      }

      // 합계 columns = SUM of debtor type columns in same row
      const totalBase = 2 + DEBTOR_TYPE_COLS.length * 3;
      for (let k = 0; k < 3; k++) {
        const sumRefs = DEBTOR_TYPE_COLS.map((_, di) => colLetter(2 + di * 3 + k) + r).join(",");
        ws1.getCell(r, totalBase + k).value = { formula: `SUM(${sumRefs})` };
        ws1.getCell(r, totalBase + k).numFmt = NUM_FMT_KRW;
        ws1.getCell(r, totalBase + k).border = THIN_BORDER;
        ws1.getCell(r, totalBase + k).alignment = { horizontal: "right" };
      }

      // Zebra stripe
      const isEven = (r - dataRowStart) % 2 === 0;
      ws1.getRow(r).eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber > 13 || colNumber === 1) return;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isEven ? XL_COLORS.zebraDark : XL_COLORS.zebraLight } };
        cell.font = { size: 10, color: { argb: XL_COLORS.titleFont } };
      });

      ws1.getRow(r).height = 22;
      r += 1;
    }

    // Total row = SUM of all creditor rows in this section
    const dataRowEnd = r - 1;
    ws1.getCell(r, 1).value = "합계";
    for (let col = 2; col <= 13; col++) {
      const cl = colLetter(col);
      ws1.getCell(r, col).value = { formula: `SUM(${cl}${dataRowStart}:${cl}${dataRowEnd})` };
      ws1.getCell(r, col).numFmt = NUM_FMT_KRW;
    }
    applyTotalRow(ws1.getRow(r), 13);
    r += 2; // blank
  }

  // ── Write and download ──
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${poolName}_채권정보.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function BondSummarySection({ poolId, poolName }: { poolId: number; poolName: string }) {
  const [summary, setSummary] = useState<BondSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [bonds, setBonds] = useState<BondDetail[]>([]);
  const [bondsTotal, setBondsTotal] = useState(0);
  const [bondsPage, setBondsPage] = useState(1);
  const [bondsLoading, setBondsLoading] = useState(false);
  const [detailBondId, setDetailBondId] = useState<number | null>(null);
  const bondsPageSize = 20;

  useEffect(() => {
    import("@/lib/api").then(({ default: api }) => {
      api.get(`/bonds/summary`, { params: { pool_id: poolId } })
        .then((res) => setSummary(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, [poolId]);

  useEffect(() => {
    setBondsLoading(true);
    import("@/lib/api").then(({ default: api }) => {
      api.get("/bonds", { params: { pool_id: poolId, page: bondsPage, size: bondsPageSize } })
        .then((res) => { setBonds(res.data.items); setBondsTotal(res.data.total); })
        .catch(() => {})
        .finally(() => setBondsLoading(false));
    });
  }, [poolId, bondsPage]);

  const handleDownload = async () => {
    if (!summary) return;
    setDownloading(true);
    try {
      const { default: api } = await import("@/lib/api");
      const { data } = await api.get("/bonds", {
        params: { pool_id: poolId, page: 1, size: 100000, include_extra: true },
      });
      await buildExcel(summary, data.items, poolName);
    } catch {
      alert("엑셀 다운로드 중 오류가 발생했습니다.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-4 rounded-full animate-spin" style={{ borderColor: "#DEDEDE", borderTopColor: "#D04A02" }} />
      </div>
    );
  }

  if (!summary) {
    return <div className="text-center py-8 text-sm" style={{ color: "#7D7D7D" }}>채권 정보가 없습니다.</div>;
  }

  const formatNum = (n: number) => n.toLocaleString("ko-KR");

  const getCell = (row: MatrixRow, dt: string): MatrixCell =>
    row.by_debtor_type[dt] || { debtor_count: 0, bond_count: 0, opb: 0 };

  return (
    <div className="space-y-8">
      {/* Header with download button */}
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors"
          style={{
            backgroundColor: downloading ? "#999" : "#2D6B2D",
            color: "white",
            borderRadius: "4px",
            cursor: downloading ? "not-allowed" : "pointer",
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16" />
          </svg>
          {downloading ? "다운로드 중..." : "엑셀 다운로드"}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border p-4" style={{ borderColor: "#DEDEDE", borderRadius: "4px" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "#7D7D7D" }}>총 차주수</p>
          <p className="text-xl font-bold" style={{ color: "#2D2D2D" }}>{formatNum(summary.total_debtor_count)}</p>
        </div>
        <div className="border p-4" style={{ borderColor: "#DEDEDE", borderRadius: "4px" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "#7D7D7D" }}>총 채권수</p>
          <p className="text-xl font-bold" style={{ color: "#2D2D2D" }}>{formatNum(summary.total_bond_count)}</p>
        </div>
        <div className="border p-4" style={{ borderColor: "#DEDEDE", borderRadius: "4px" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "#7D7D7D" }}>총 OPB</p>
          <p className="text-xl font-bold" style={{ color: "#2D2D2D" }}>{formatNum(summary.total_opb)}원</p>
        </div>
      </div>

      {/* Matrix sections */}
      {summary.matrix.length === 0 ? (
        <div className="text-center py-8 text-sm" style={{ color: "#7D7D7D" }}>
          Import된 채권 데이터가 없습니다.
        </div>
      ) : (
        summary.matrix.map((section) => (
          <div key={section.bond_type}>
            <h3 className="text-base font-bold mb-3" style={{ color: "#2D2D2D" }}>
              {section.bond_type_label}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "#F0F0F0" }}>
                    <th rowSpan={2} className="px-3 py-2.5 font-semibold text-left border" style={{ minWidth: "120px", color: "#2D2D2D", borderColor: "#DEDEDE" }}>
                      매도인(금융회사)
                    </th>
                    {DEBTOR_TYPE_COLS.map((dt) => (
                      <th key={dt} colSpan={3} className="px-3 py-2.5 font-semibold text-center border" style={{ color: "#2D2D2D", borderColor: "#DEDEDE" }}>
                        {dt}
                      </th>
                    ))}
                    <th colSpan={3} className="px-3 py-2.5 font-semibold text-center border" style={{ color: "#2D2D2D", borderColor: "#DEDEDE" }}>
                      합계
                    </th>
                  </tr>
                  <tr style={{ backgroundColor: "#F7F7F7" }}>
                    {[...DEBTOR_TYPE_COLS, "합계"].map((dt) => (
                      ["차주수", "채권수", "OPB"].map((metric) => (
                        <th key={`${dt}-${metric}`} className="px-2 py-1.5 text-xs font-medium text-right border whitespace-nowrap" style={{ color: "#7D7D7D", borderColor: "#DEDEDE" }}>
                          {metric}
                        </th>
                      ))
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA" }}>
                      <td className="px-3 py-2 font-medium border" style={{ borderColor: "#DEDEDE", color: "#2D2D2D" }}>
                        {row.creditor}
                      </td>
                      {DEBTOR_TYPE_COLS.map((dt) => {
                        const cell = getCell(row, dt);
                        return [
                          <td key={`${dt}-dc`} className="px-2 py-2 text-right border" style={{ borderColor: "#DEDEDE" }}>{formatNum(cell.debtor_count)}</td>,
                          <td key={`${dt}-bc`} className="px-2 py-2 text-right border" style={{ borderColor: "#DEDEDE" }}>{formatNum(cell.bond_count)}</td>,
                          <td key={`${dt}-opb`} className="px-2 py-2 text-right border" style={{ borderColor: "#DEDEDE" }}>{formatNum(cell.opb)}</td>,
                        ];
                      })}
                      <td className="px-2 py-2 text-right border font-medium" style={{ borderColor: "#DEDEDE" }}>{formatNum(row.total.debtor_count)}</td>
                      <td className="px-2 py-2 text-right border font-medium" style={{ borderColor: "#DEDEDE" }}>{formatNum(row.total.bond_count)}</td>
                      <td className="px-2 py-2 text-right border font-medium" style={{ borderColor: "#DEDEDE" }}>{formatNum(row.total.opb)}</td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr style={{ backgroundColor: "#F5F5F5" }}>
                    <td className="px-3 py-2 font-bold border" style={{ borderColor: "#DEDEDE", color: "#2D2D2D" }}>
                      합계
                    </td>
                    {DEBTOR_TYPE_COLS.map((dt) => {
                      const cell = getCell(section.total, dt);
                      return [
                        <td key={`total-${dt}-dc`} className="px-2 py-2 text-right border font-bold" style={{ borderColor: "#DEDEDE" }}>{formatNum(cell.debtor_count)}</td>,
                        <td key={`total-${dt}-bc`} className="px-2 py-2 text-right border font-bold" style={{ borderColor: "#DEDEDE" }}>{formatNum(cell.bond_count)}</td>,
                        <td key={`total-${dt}-opb`} className="px-2 py-2 text-right border font-bold" style={{ borderColor: "#DEDEDE" }}>{formatNum(cell.opb)}</td>,
                      ];
                    })}
                    <td className="px-2 py-2 text-right border font-bold" style={{ borderColor: "#DEDEDE" }}>{formatNum(section.total.total.debtor_count)}</td>
                    <td className="px-2 py-2 text-right border font-bold" style={{ borderColor: "#DEDEDE" }}>{formatNum(section.total.total.bond_count)}</td>
                    <td className="px-2 py-2 text-right border font-bold" style={{ borderColor: "#DEDEDE" }}>{formatNum(section.total.total.opb)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Bond list table */}
      {summary && summary.total_bond_count > 0 && (
        <div>
          <h3 className="text-base font-bold mb-3" style={{ color: "#2D2D2D" }}>
            채권 목록
          </h3>
          {bondsLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-3 rounded-full animate-spin" style={{ borderColor: "#DEDEDE", borderTopColor: "#D04A02" }} />
            </div>
          ) : bonds.length === 0 ? (
            <p className="text-center py-4 text-sm" style={{ color: "#7D7D7D" }}>채권 데이터가 없습니다.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: "900px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#2D2D2D" }}>
                      {["No", "유형", "채권번호", "차주구분", "금융회사", "OPB", "합계잔액", "상세"].map((h) => (
                        <th key={h} className="px-3 py-2.5 font-semibold text-white whitespace-nowrap text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bonds.map((bond, idx) => (
                      <tr
                        key={bond.id}
                        className="cursor-pointer hover:bg-gray-50"
                        style={{ backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFA", borderBottom: "1px solid #DEDEDE" }}
                        onClick={() => setDetailBondId(bond.id)}
                      >
                        <td className="px-3 py-2">{(bondsPage - 1) * bondsPageSize + idx + 1}</td>
                        <td className="px-3 py-2">
                          <span className="inline-block px-1.5 py-0.5 text-xs rounded" style={{ backgroundColor: "#F5F5F5", color: "#464646", border: "1px solid #DEDEDE" }}>
                            {bond.bond_type || "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2">{bond.bond_no || "—"}</td>
                        <td className="px-3 py-2">{bond.debtor_type || "—"}</td>
                        <td className="px-3 py-2">{bond.creditor || "—"}</td>
                        <td className="px-3 py-2 text-right">{bond.opb != null ? formatNum(bond.opb) : "—"}</td>
                        <td className="px-3 py-2 text-right">{bond.total_balance != null ? formatNum(bond.total_balance) : "—"}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setDetailBondId(bond.id); }}
                            className="text-xs font-medium hover:underline cursor-pointer"
                            style={{ color: "#D04A02" }}
                          >
                            상세
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {Math.ceil(bondsTotal / bondsPageSize) > 1 && (
                <div className="flex justify-end gap-1 mt-3">
                  {Array.from({ length: Math.min(Math.ceil(bondsTotal / bondsPageSize), 10) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setBondsPage(p)}
                      className="px-3 py-1 text-sm border cursor-pointer"
                      style={{
                        borderRadius: "4px",
                        backgroundColor: p === bondsPage ? "#D04A02" : "white",
                        color: p === bondsPage ? "white" : "#2D2D2D",
                        borderColor: p === bondsPage ? "#D04A02" : "#DEDEDE",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {detailBondId !== null && (
        <BondDetailModal bondId={detailBondId} onClose={() => setDetailBondId(null)} />
      )}
    </div>
  );
}
