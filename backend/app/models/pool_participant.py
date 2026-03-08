from datetime import datetime

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PoolParticipant(Base):
    __tablename__ = "pool_participants"

    pool_id: Mapped[int] = mapped_column(ForeignKey("pools.id"), primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), primary_key=True)
    participated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    pool = relationship("Pool", back_populates="participants")
    company = relationship("Company", back_populates="pool_participants")
