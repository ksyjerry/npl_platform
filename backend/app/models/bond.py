from datetime import date, datetime
from typing import Optional

from sqlalchemy import BigInteger, Boolean, Date, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Bond(Base):
    __tablename__ = "bonds"

    id: Mapped[int] = mapped_column(primary_key=True)
    pool_id: Mapped[int] = mapped_column(ForeignKey("pools.id"), nullable=False)
    bond_type: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # A, B1, B2, C
    bond_no: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    debtor_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    debtor_id_masked: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    creditor: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)  # 금융회사명
    product_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    collateral_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    collateral_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    original_amount: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    opb: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    interest_balance: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    total_balance: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    overdue_start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    overdue_months: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    legal_status: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    transfer_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 양도횟수
    extra_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # 유형별 추가 컬럼 저장
    import_batch: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    pool = relationship("Pool", backref="bonds")
