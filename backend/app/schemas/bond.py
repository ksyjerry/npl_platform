from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class BondResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    pool_id: int
    bond_no: Optional[str] = None
    debtor_type: Optional[str] = None
    debtor_id_masked: Optional[str] = None
    creditor: Optional[str] = None
    product_type: Optional[str] = None
    collateral_type: Optional[str] = None
    collateral_address: Optional[str] = None
    original_amount: Optional[int] = None
    opb: Optional[int] = None
    interest_balance: Optional[int] = None
    total_balance: Optional[int] = None
    overdue_start_date: Optional[date] = None
    overdue_months: Optional[int] = None
    legal_status: Optional[str] = None
    import_batch: Optional[str] = None
    created_at: Optional[datetime] = None


class BondUpdate(BaseModel):
    reason: str

    @field_validator("reason")
    @classmethod
    def reason_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("수정 사유를 입력해주세요.")
        return v.strip()

    bond_no: Optional[str] = None
    debtor_type: Optional[str] = None
    debtor_id_masked: Optional[str] = None
    creditor: Optional[str] = None
    product_type: Optional[str] = None
    collateral_type: Optional[str] = None
    collateral_address: Optional[str] = None
    original_amount: Optional[int] = None
    opb: Optional[int] = None
    interest_balance: Optional[int] = None
    total_balance: Optional[int] = None
    overdue_start_date: Optional[date] = None
    overdue_months: Optional[int] = None
    legal_status: Optional[str] = None


class BondDeleteSchema(BaseModel):
    reason: str

    @field_validator("reason")
    @classmethod
    def reason_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("삭제 사유를 입력해주세요.")
        return v.strip()


class BondListResponse(BaseModel):
    items: list[BondResponse]
    total: int
    page: int
    size: int


class BondImportResult(BaseModel):
    file_name: str
    row_count: int
    success_count: int
    error_count: int
    errors: Optional[list[dict]] = None


class BondSummaryCategory(BaseModel):
    label: str
    bond_count: int
    total_opb: int
    total_balance: int


class BondSummary(BaseModel):
    pool_id: int
    total_bond_count: int
    total_opb: int
    total_balance: int
    by_debtor_type: list[BondSummaryCategory] = []
    by_product_type: list[BondSummaryCategory] = []
    by_collateral_type: list[BondSummaryCategory] = []
    by_legal_status: list[BondSummaryCategory] = []
    by_overdue_range: list[BondSummaryCategory] = []
