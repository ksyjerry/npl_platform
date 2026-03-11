import io
from datetime import date, datetime
from uuid import uuid4

from fastapi import UploadFile
from fastapi.responses import StreamingResponse
from openpyxl import Workbook, load_workbook
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bond import Bond
from app.models.bond_import_log import BondImportLog
from app.models.user import User
from app.schemas.bond import BondImportResult

# Excel header (Korean) → model field mapping
COLUMN_MAP = {
    "채권번호": "bond_no",
    "차주구분": "debtor_type",
    "차주ID": "debtor_id_masked",
    "채권자": "creditor",
    "상품유형": "product_type",
    "담보유형": "collateral_type",
    "담보주소": "collateral_address",
    "원금": "original_amount",
    "OPB": "opb",
    "이자잔액": "interest_balance",
    "합계잔액": "total_balance",
    "연체시작일": "overdue_start_date",
    "연체개월": "overdue_months",
    "법적상태": "legal_status",
}

# Template column order (defines the Excel template layout)
TEMPLATE_COLUMNS = list(COLUMN_MAP.keys())

INT_FIELDS = {
    "original_amount", "opb", "interest_balance", "total_balance", "overdue_months"
}

DATE_FIELDS = {"overdue_start_date"}


def generate_template() -> StreamingResponse:
    """Generate a blank Excel template with headers and column descriptions."""
    wb = Workbook()
    ws = wb.active
    ws.title = "채권 데이터"

    # Header row
    for col_idx, header in enumerate(TEMPLATE_COLUMNS, start=1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.font = cell.font.copy(bold=True)

    # Description row (row 2) as guide — light gray
    descriptions = {
        "채권번호": "예: B001",
        "차주구분": "개인 / 법인",
        "차주ID": "마스킹된 ID (예: ***-1234)",
        "채권자": "금융기관명",
        "상품유형": "신용대출, 담보대출 등",
        "담보유형": "무담보, 부동산 등",
        "담보주소": "담보물 주소",
        "원금": "숫자 (원)",
        "OPB": "숫자 (원)",
        "이자잔액": "숫자 (원)",
        "합계잔액": "숫자 (원)",
        "연체시작일": "YYYY-MM-DD",
        "연체개월": "숫자",
        "법적상태": "정상, 소송중 등",
    }
    from openpyxl.styles import Font, PatternFill
    guide_font = Font(color="999999", italic=True, size=9)
    guide_fill = PatternFill(start_color="F5F5F5", end_color="F5F5F5", fill_type="solid")
    for col_idx, header in enumerate(TEMPLATE_COLUMNS, start=1):
        cell = ws.cell(row=2, column=col_idx, value=descriptions.get(header, ""))
        cell.font = guide_font
        cell.fill = guide_fill

    # Auto-adjust column widths
    for col_idx, header in enumerate(TEMPLATE_COLUMNS, start=1):
        ws.column_dimensions[ws.cell(row=1, column=col_idx).column_letter].width = max(len(header) * 2.5, 12)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=bond_import_template.xlsx"},
    )


async def import_excel(
    file: UploadFile,
    pool_id: int,
    user: User,
    db: AsyncSession,
) -> BondImportResult:
    content = await file.read()
    wb = load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return BondImportResult(
            file_name=file.filename or "unknown.xlsx",
            row_count=0, success_count=0, error_count=0, errors=None,
        )

    # First row = headers
    headers = [str(h).strip() if h else "" for h in rows[0]]

    # Build header index → model field mapping
    header_map: dict[int, str] = {}
    for idx, h in enumerate(headers):
        if h in COLUMN_MAP:
            header_map[idx] = COLUMN_MAP[h]

    batch_id = str(uuid4())[:8]
    bonds: list[Bond] = []
    errors: list[dict] = []
    row_count = 0

    for row_idx, row in enumerate(rows[1:], start=2):
        # Skip description/guide row (row 2) and empty rows
        if row_idx == 2:
            # Check if this looks like the guide row
            first_val = str(row[0]).strip() if row[0] else ""
            if first_val.startswith("예:") or first_val == "":
                continue

        # Skip fully empty rows
        if all(cell is None or str(cell).strip() == "" for cell in row):
            continue

        row_count += 1
        try:
            bond_data: dict = {
                "pool_id": pool_id,
                "import_batch": batch_id,
                "created_by": user.id,
            }
            for col_idx, model_field in header_map.items():
                if col_idx < len(row):
                    val = row[col_idx]
                    if val is not None:
                        # Handle datetime/date objects from Excel directly
                        if model_field in DATE_FIELDS:
                            if isinstance(val, (date, datetime)):
                                val = val if isinstance(val, date) and not isinstance(val, datetime) else val.date() if isinstance(val, datetime) else val
                            else:
                                val_str = str(val).strip()
                                val = date.fromisoformat(val_str) if val_str else None
                        elif model_field in INT_FIELDS:
                            val_str = str(val).strip()
                            if not val_str:
                                val = None
                            else:
                                val = int(float(val_str.replace(",", "")))
                        else:
                            val_str = str(val).strip()
                            val = val_str if val_str else None
                    bond_data[model_field] = val

            bonds.append(Bond(**bond_data))
        except Exception as e:
            errors.append({"row": row_idx, "error": str(e)})

    wb.close()

    # Bulk insert valid bonds
    db.add_all(bonds)

    # Create import log
    log = BondImportLog(
        pool_id=pool_id,
        file_name=file.filename or "unknown.xlsx",
        row_count=row_count,
        success_count=len(bonds),
        error_count=len(errors),
        errors=errors if errors else None,
        imported_by=user.id,
    )
    db.add(log)
    await db.commit()

    return BondImportResult(
        file_name=file.filename or "unknown.xlsx",
        row_count=row_count,
        success_count=len(bonds),
        error_count=len(errors),
        errors=errors if errors else None,
    )
