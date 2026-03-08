from typing import Optional

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PoolCompany(Base):
    __tablename__ = "pool_companies"

    id: Mapped[int] = mapped_column(primary_key=True)
    pool_id: Mapped[int] = mapped_column(ForeignKey("pools.id"), nullable=False)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # seller | buyer
    advisor: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    buyer_checklist_ok: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    pool = relationship("Pool", back_populates="pool_companies")
    company = relationship("Company", back_populates="pool_companies")
