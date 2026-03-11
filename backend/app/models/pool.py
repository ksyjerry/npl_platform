from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import ARRAY, BigInteger, Boolean, Computed, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Pool(Base):
    __tablename__ = "pools"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)

    # 담보 정보 (미공개 필드) — TEXT[] arrays for multiple selection
    collateral_large: Mapped[Optional[list[str]]] = mapped_column(ARRAY(Text), nullable=True)
    collateral_small: Mapped[Optional[list[str]]] = mapped_column(ARRAY(Text), nullable=True)

    # 거래 정보
    cutoff_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    bid_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    closing_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    sale_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    bidder_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # 채권 정보
    debtor_type: Mapped[Optional[list[str]]] = mapped_column(ARRAY(Text), nullable=True)
    debtor_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    bond_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    avg_overdue_months: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 1), nullable=True)
    opb: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)

    # 가격 정보
    sale_price: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    sale_ratio: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(7, 4),
        Computed("CASE WHEN opb > 0 THEN sale_price::NUMERIC / opb ELSE NULL END", persisted=True),
        nullable=True,
    )

    # 재매각 정보
    resale_included: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)
    resale_debtor_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    resale_bond_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    resale_opb: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)

    # 기타
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    updated_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)

    participants = relationship("PoolParticipant", back_populates="pool")
    pool_companies = relationship("PoolCompany", back_populates="pool")
    documents = relationship("Document", back_populates="pool")
    notices = relationship("Notice", back_populates="pool")
