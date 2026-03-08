from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    table_name: Mapped[str] = mapped_column(String(100), nullable=False)
    record_id: Mapped[int] = mapped_column(Integer, nullable=False)
    action: Mapped[str] = mapped_column(String(20), nullable=False)  # CREATE | UPDATE | DELETE
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    old_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    new_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    performed_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    performed_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)
