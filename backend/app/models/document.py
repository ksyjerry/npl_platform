from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    pool_id: Mapped[int] = mapped_column(ForeignKey("pools.id"), nullable=False)
    uploader_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    role_type: Mapped[str] = mapped_column(String(20), nullable=False)  # seller | buyer | accountant
    file_name: Mapped[str] = mapped_column(String(500), nullable=False)
    file_path_enc: Mapped[str] = mapped_column(Text, nullable=False)  # AES-256 encrypted
    file_size: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    memo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)

    pool = relationship("Pool", back_populates="documents")
