from datetime import datetime

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # seller | buyer | accountant
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    users = relationship("User", back_populates="company")
    pool_participants = relationship("PoolParticipant", back_populates="company")
    pool_companies = relationship("PoolCompany", back_populates="company")
