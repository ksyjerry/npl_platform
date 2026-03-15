/**
 * Bond type-specific column metadata for detail view.
 * Keys match the extra_data JSON keys from Excel import (한글 headers).
 * Common fields (금융회사명, 고객번호, 채권번호, 차주구분, 양도횟수) are in the Bond model.
 */

export interface BondColumnDef {
  key: string;
  label: string;
  type: "text" | "number" | "date";
  group?: string;
}

// ─── A: 일반무담보 (extra_data columns) ───
export const COLUMNS_A: BondColumnDef[] = [
  { key: "상각 여부", label: "상각 여부", type: "text" },
  { key: "생년월일", label: "생년월일", type: "text" },
  { key: "채무자 주소지", label: "채무자 주소지", type: "text" },
  { key: "최초대출성격 구분", label: "최초대출성격 구분", type: "text" },
  { key: "최초대출일", label: "최초대출일", type: "date" },
  { key: "만기일", label: "만기일", type: "date" },
  { key: "정상금리", label: "정상금리", type: "number" },
  { key: "연체금리", label: "연체금리", type: "number" },
  { key: "연체일 기준 채권원금", label: "연체일 기준 채권원금", type: "number" },
  { key: "연체일 기준 이자", label: "연체일 기준 이자", type: "number" },
  { key: "연체일 기준 가지급금", label: "연체일 기준 가지급금", type: "number" },
  { key: "상각일", label: "상각일", type: "date" },
  { key: "상각일 기준 원금", label: "상각일 기준 원금", type: "number" },
  { key: "상각일 기준 이자", label: "상각일 기준 이자", type: "number" },
  { key: "상각일 기준 가지급금", label: "상각일 기준 가지급금", type: "number" },
  { key: "자산확정일 기준 채권원금잔액", label: "자산확정일 기준 채권원금잔액", type: "number" },
  { key: "자산확정일 기준 이자 잔액", label: "자산확정일 기준 이자 잔액", type: "number" },
  { key: "자산확정일 기준 가지급금 잔액", label: "자산확정일 기준 가지급금 잔액", type: "number" },
  { key: "시효완성 예정일", label: "시효완성 예정일", type: "date" },
  { key: "개인회생여부", label: "개인회생여부", type: "text" },
  { key: "신용회복여부", label: "신용회복여부", type: "text" },
  { key: "가압류 여부", label: "가압류 여부", type: "text" },
  { key: "가처분 여부", label: "가처분 여부", type: "text" },
  { key: "보증인 수", label: "보증인 수", type: "number" },
  { key: "기타", label: "기타", type: "text" },
];

// ─── B1: CCRS ───
// Base columns (non-repeating)
const B1_BASE: BondColumnDef[] = [
  { key: "상각 여부", label: "상각 여부", type: "text" },
  { key: "채무자 주소지", label: "채무자 주소지", type: "text" },
  { key: "차주연령", label: "차주연령", type: "number" },
  { key: "접수번호", label: "접수번호", type: "text", group: "접수정보" },
  { key: "거래일", label: "거래일", type: "date", group: "접수정보" },
  { key: "심의차수", label: "심의차수", type: "text", group: "접수정보" },
  { key: "신청인진행상태", label: "신청인진행상태", type: "text", group: "접수정보" },
  { key: "계좌진행상태내용", label: "계좌진행상태내용", type: "text", group: "접수정보" },
  { key: "실효/완제/합의서포기일자", label: "실효/완제/합의서포기일자", type: "date", group: "접수정보" },
  { key: "접수통지일자", label: "접수통지일자", type: "date", group: "접수정보" },
  { key: "접수일자", label: "접수일자", type: "date", group: "접수정보" },
  { key: "점포명", label: "점포명", type: "text" },
  { key: "확정자통지일", label: "확정자통지일", type: "date" },
  { key: "개인채무조정합의서체결일(확정일)", label: "합의서체결일(확정일)", type: "date" },
  { key: "상환개시일", label: "상환개시일", type: "date" },
  { key: "조정전이율", label: "조정전이율", type: "number", group: "조정전후" },
  { key: "조정후이율", label: "조정후이율", type: "number", group: "조정전후" },
  { key: "최초대출원금", label: "최초대출원금", type: "number", group: "조정전후" },
  { key: "조정전원금", label: "조정전원금", type: "number", group: "조정전후" },
  { key: "조정전이자", label: "조정전이자", type: "number", group: "조정전후" },
  { key: "조정전연체이자", label: "조정전연체이자", type: "number", group: "조정전후" },
  { key: "조정전비용", label: "조정전비용", type: "number", group: "조정전후" },
  { key: "조정전합계", label: "조정전합계", type: "number", group: "조정전후" },
  { key: "조정후원금", label: "조정후원금", type: "number", group: "조정전후" },
  { key: "조정후이자", label: "조정후이자", type: "number", group: "조정전후" },
  { key: "조정후연체이자", label: "조정후연체이자", type: "number", group: "조정전후" },
  { key: "조정후비용", label: "조정후비용", type: "number", group: "조정전후" },
  { key: "조정후합계", label: "조정후합계", type: "number", group: "조정전후" },
  { key: "원금감면여부", label: "원금감면여부", type: "text" },
  { key: "조정대상포함여부", label: "조정대상포함여부", type: "text" },
  { key: "총상환기간", label: "총상환기간", type: "number", group: "상환정보" },
  { key: "유예기간", label: "유예기간", type: "number", group: "상환정보" },
  { key: "원금균등상환기간", label: "원금균등상환기간", type: "number", group: "상환정보" },
  { key: "원리균등상환기간", label: "원리균등상환기간", type: "number", group: "상환정보" },
  { key: "이자상환기간", label: "이자상환기간", type: "number", group: "상환정보" },
  { key: "납입회차", label: "납입회차", type: "number", group: "상환정보" },
  { key: "연체기간", label: "연체기간", type: "number", group: "상환정보" },
  { key: "총납입금액", label: "총납입금액", type: "number", group: "상환정보" },
  { key: "원금균등시작회차", label: "원금균등시작회차", type: "number", group: "상환정보" },
  { key: "원금균등종료회차", label: "원금균등종료회차", type: "number", group: "상환정보" },
  { key: "원리균등시작회차", label: "원리균등시작회차", type: "number", group: "상환정보" },
  { key: "원리균등종료회차", label: "원리균등종료회차", type: "number", group: "상환정보" },
  { key: "이자상환시작회차", label: "이자상환시작회차", type: "number", group: "상환정보" },
  { key: "이자상환종료회차", label: "이자상환종료회차", type: "number", group: "상환정보" },
  { key: "원금균등채무액", label: "원금균등채무액", type: "number", group: "상환정보" },
  { key: "총납입원금", label: "총납입원금", type: "number", group: "상환정보" },
  { key: "총납입이자", label: "총납입이자", type: "number", group: "상환정보" },
  { key: "총납입기타채무", label: "총납입기타채무", type: "number", group: "상환정보" },
  { key: "상환후잔액", label: "상환후잔액", type: "number", group: "상환정보" },
  { key: "감면율", label: "감면율", type: "number" },
  { key: "추심원금", label: "추심원금", type: "number" },
  { key: "급여가압류원금", label: "급여가압류원금", type: "number" },
  { key: "채무구분", label: "채무구분", type: "text" },
];

// 10-stage repayment plan columns
const B1_STAGE_FIELDS = [
  "납입구분", "시작회차", "종료회차",
  "개인채무조정1 적용이율", "개인채무조정2 적용이율",
  "개인채무조정1 월상환액", "개인채무조정2 월상환액",
];

// Fields that are joined without space in the template (e.g. "1단계납입구분")
const B1_STAGE_NO_SPACE_FIELDS = ["납입구분", "시작회차", "종료회차"];

function generateStageColumns(): BondColumnDef[] {
  const cols: BondColumnDef[] = [];
  for (let stage = 1; stage <= 10; stage++) {
    const group = `${stage}단계 변제계획`;
    for (const field of B1_STAGE_FIELDS) {
      const key = B1_STAGE_NO_SPACE_FIELDS.includes(field)
        ? `${stage}단계${field}`
        : `${stage}단계 ${field}`;
      const isNumber = field !== "납입구분";
      cols.push({ key, label: `${field}`, type: isNumber ? "number" : "text", group });
    }
  }
  return cols;
}

const B1_TAIL: BondColumnDef[] = [
  { key: "동의요청일", label: "동의요청일", type: "date", group: "기타정보" },
  { key: "동의확정일", label: "동의확정일", type: "date", group: "기타정보" },
  { key: "재조정여부", label: "재조정여부", type: "text", group: "기타정보" },
  { key: "재조정횟수", label: "재조정횟수", type: "number", group: "기타정보" },
  { key: "수정조정여부", label: "수정조정여부", type: "text", group: "기타정보" },
  { key: "수정조정횟수", label: "수정조정횟수", type: "number", group: "기타정보" },
  { key: "재조정이전납입금액", label: "재조정이전납입금액", type: "number", group: "기타정보" },
  { key: "원금완제면제이자", label: "원금완제면제이자", type: "number", group: "기타정보" },
  { key: "출금정지등록여부", label: "출금정지등록여부", type: "text", group: "기타정보" },
  { key: "재조정접수일자", label: "재조정접수일자", type: "date", group: "기타정보" },
  { key: "재조정처리일자", label: "재조정처리일자", type: "date", group: "기타정보" },
  { key: "재조정반송일자", label: "재조정반송일자", type: "date", group: "기타정보" },
  { key: "실효취소요청일자", label: "실효취소요청일자", type: "date", group: "기타정보" },
  { key: "실효원상회복일자", label: "실효원상회복일자", type: "date", group: "기타정보" },
  { key: "상각구분", label: "상각구분", type: "text", group: "기타정보" },
  { key: "신청구분", label: "신청구분", type: "text", group: "기타정보" },
  { key: "일시납감면율", label: "일시납감면율", type: "number", group: "기타정보" },
  { key: "차상위계층여부", label: "차상위계층여부", type: "text", group: "기타정보" },
  { key: "미납발생일", label: "미납발생일", type: "date", group: "기타정보" },
  { key: "부동산담보대출여부", label: "부동산담보대출여부", type: "text", group: "기타정보" },
  { key: "거치기간", label: "거치기간", type: "number", group: "기타정보" },
  { key: "감면방식", label: "감면방식", type: "text", group: "기타정보" },
  { key: "상환방식", label: "상환방식", type: "text", group: "기타정보" },
  { key: "체증식 계좌여부", label: "체증식 계좌여부", type: "text", group: "기타정보" },
  { key: "체증전 구간의 시작회차", label: "체증전 구간의 시작회차", type: "number", group: "기타정보" },
  { key: "체증전 구간의 종료회차", label: "체증전 구간의 종료회차", type: "number", group: "기타정보" },
  { key: "체증전 구간의 기준기간", label: "체증전 구간의 기준기간", type: "number", group: "기타정보" },
  { key: "담보권실행유예기간", label: "담보권실행유예기간", type: "number", group: "기타정보" },
  { key: "특별면책", label: "특별면책", type: "text", group: "기타정보" },
  { key: "재난상환유예", label: "재난상환유예", type: "text", group: "기타정보" },
  { key: "특례지원", label: "특례지원", type: "text", group: "기타정보" },
  { key: "이자율 재조정", label: "이자율 재조정", type: "text", group: "기타정보" },
];

export const COLUMNS_B1: BondColumnDef[] = [
  ...B1_BASE,
  ...generateStageColumns(),
  ...B1_TAIL,
];

// ─── B2: IRL ───
export const COLUMNS_B2: BondColumnDef[] = [
  { key: "상각 여부", label: "상각 여부", type: "text" },
  { key: "채무자 주소지", label: "채무자 주소지", type: "text" },
  { key: "차주연령", label: "차주연령", type: "number" },
  { key: "채권진행상황", label: "채권진행상황", type: "text" },
  { key: "개시일자", label: "개시일자", type: "date" },
  { key: "인가일자", label: "인가일자", type: "date" },
  { key: "총변제회차", label: "총변제회차", type: "number" },
  { key: "납입회차", label: "납입회차", type: "number" },
  { key: "잔여회차", label: "잔여회차", type: "number" },
  { key: "총변제예정금액", label: "총변제예정금액", type: "number" },
  { key: "기상환금액", label: "기상환금액", type: "number" },
  { key: "자산확정일 시점 채권 원금잔액", label: "자산확정일 시점 채권 원금잔액", type: "number" },
  { key: "신고 시점 채권 원금잔액", label: "신고 시점 채권 원금잔액", type: "number" },
  { key: "법원명", label: "법원명", type: "text" },
  { key: "사건번호", label: "사건번호", type: "text" },
];

// ─── C: 담보 ───
export const COLUMNS_C: BondColumnDef[] = [
  { key: "상각 여부", label: "상각 여부", type: "text" },
  { key: "생년월일", label: "생년월일", type: "text" },
  { key: "차주명", label: "차주명", type: "text" },
  { key: "연체이자율(%)", label: "연체이자율(%)", type: "number" },
  { key: "정상이자율(%)", label: "정상이자율(%)", type: "number" },
  { key: "최초대출일", label: "최초대출일", type: "date" },
  { key: "대출만기일", label: "대출만기일", type: "date" },
  { key: "가지급금", label: "가지급금", type: "number" },
  { key: "미수이자", label: "미수이자", type: "number" },
];

// ─── Lookup helper ───
export const BOND_TYPE_COLUMNS: Record<string, BondColumnDef[]> = {
  A: COLUMNS_A,
  B1: COLUMNS_B1,
  B2: COLUMNS_B2,
  C: COLUMNS_C,
};

export function getColumnsForType(bondType: string): BondColumnDef[] {
  return BOND_TYPE_COLUMNS[bondType] || [];
}

/**
 * Group columns by their `group` field. Ungrouped columns go into "기본 상세정보".
 */
export function groupColumns(columns: BondColumnDef[]): { group: string; columns: BondColumnDef[] }[] {
  const groups: { group: string; columns: BondColumnDef[] }[] = [];
  const map = new Map<string, BondColumnDef[]>();

  for (const col of columns) {
    const g = col.group || "기본 상세정보";
    if (!map.has(g)) {
      map.set(g, []);
      groups.push({ group: g, columns: map.get(g)! });
    }
    map.get(g)!.push(col);
  }
  return groups;
}
