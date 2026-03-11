from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class PoolCompanyInput(BaseModel):
    company_id: int
    advisor: Optional[str] = None
    buyer_checklist_ok: Optional[bool] = None


class PoolCreateSchema(BaseModel):
    name: str
    status: Optional[str] = "active"
    collateral_large: Optional[list[str]] = None
    collateral_small: Optional[list[str]] = None
    cutoff_date: Optional[date] = None
    bid_date: Optional[date] = None
    closing_date: Optional[date] = None
    sale_method: Optional[str] = None
    bidder_count: Optional[int] = None
    debtor_type: Optional[list[str]] = None
    debtor_count: Optional[int] = None
    bond_count: Optional[int] = None
    avg_overdue_months: Optional[float] = None
    opb: Optional[int] = None
    sale_price: Optional[int] = None
    resale_included: Optional[bool] = None
    resale_debtor_count: Optional[int] = None
    resale_bond_count: Optional[int] = None
    resale_opb: Optional[int] = None
    remarks: Optional[str] = None
    seller_companies: Optional[list[PoolCompanyInput]] = None
    buyer_companies: Optional[list[PoolCompanyInput]] = None


class PoolUpdateSchema(BaseModel):
    reason: str

    @field_validator("reason")
    @classmethod
    def reason_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("수정 사유를 입력해주세요.")
        return v.strip()

    name: Optional[str] = None
    status: Optional[str] = None
    collateral_large: Optional[list[str]] = None
    collateral_small: Optional[list[str]] = None
    cutoff_date: Optional[date] = None
    bid_date: Optional[date] = None
    closing_date: Optional[date] = None
    sale_method: Optional[str] = None
    bidder_count: Optional[int] = None
    debtor_type: Optional[list[str]] = None
    debtor_count: Optional[int] = None
    bond_count: Optional[int] = None
    avg_overdue_months: Optional[float] = None
    opb: Optional[int] = None
    sale_price: Optional[int] = None
    resale_included: Optional[bool] = None
    resale_debtor_count: Optional[int] = None
    resale_bond_count: Optional[int] = None
    resale_opb: Optional[int] = None
    remarks: Optional[str] = None
    seller_companies: Optional[list[PoolCompanyInput]] = None
    buyer_companies: Optional[list[PoolCompanyInput]] = None


class PoolCompanyItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    company_id: int
    name: str
    advisor: Optional[str] = None
    checklist_ok: Optional[bool] = None


class PoolListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    status: str
    collateral_large: Optional[list[str]] = None
    collateral_small: Optional[list[str]] = None
    cutoff_date: Optional[date] = None
    bid_date: Optional[date] = None
    closing_date: Optional[date] = None
    seller_name: Optional[str] = None
    buyer_name: Optional[str] = None
    opb: Optional[int] = None
    sale_price: Optional[int] = None
    sale_ratio: Optional[float] = None
    remarks: Optional[str] = None
    can_view_detail: bool = False


class PoolListResponse(BaseModel):
    items: list[PoolListItem]
    total: int
    page: int
    size: int


class PoolDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    status: str
    # 거래 정보
    cutoff_date: Optional[date] = None
    bid_date: Optional[date] = None
    closing_date: Optional[date] = None
    sale_method: Optional[str] = None
    bidder_count: Optional[int] = None
    # 거래 참여자
    seller_companies: list[PoolCompanyItem] = []
    buyer_companies: list[PoolCompanyItem] = []
    # 담보
    collateral_large: Optional[list[str]] = None
    collateral_small: Optional[list[str]] = None
    # 채권
    debtor_type: Optional[list[str]] = None
    debtor_count: Optional[int] = None
    bond_count: Optional[int] = None
    avg_overdue_months: Optional[float] = None
    opb: Optional[int] = None
    # 가격
    sale_price: Optional[int] = None
    sale_ratio: Optional[float] = None
    # 재매각
    resale_included: Optional[bool] = None
    resale_debtor_count: Optional[int] = None
    resale_bond_count: Optional[int] = None
    resale_opb: Optional[int] = None
    # 기타
    remarks: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
