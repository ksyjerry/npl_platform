from datetime import datetime
from typing import Optional

from sqlalchemy import ARRAY, Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    azure_oid: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(200), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    title: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    phone_office: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    phone_mobile: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    role: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    interests: Mapped[Optional[list[str]]] = mapped_column(ARRAY(Text), default=list)
    allowed_ips: Mapped[Optional[list[str]]] = mapped_column(ARRAY(Text), default=list)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    last_login_ip: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    company = relationship("Company", back_populates="users")
