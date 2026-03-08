from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str
    role: str
    is_verified: bool
    department: Optional[str] = None
    title: Optional[str] = None
    phone_office: Optional[str] = None
    phone_mobile: Optional[str] = None
    last_login_ip: Optional[str] = None
    created_at: datetime


class UserMeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str
    role: str
    is_verified: bool
    company_name: str
    department: Optional[str] = None
    title: Optional[str] = None
    phone_office: Optional[str] = None
    phone_mobile: Optional[str] = None
    last_login_ip: Optional[str] = None
    created_at: datetime


class UserMeUpdate(BaseModel):
    reason: str
    name: Optional[str] = None
    department: Optional[str] = None
    title: Optional[str] = None
    phone_office: Optional[str] = None
    phone_mobile: Optional[str] = None

    @field_validator("reason")
    def reason_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("수정 사유를 입력해주세요.")
        return v.strip()
