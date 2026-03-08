from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class UserUpdateSchema(BaseModel):
    reason: str
    role: Optional[str] = None
    is_verified: Optional[bool] = None
    company_id: Optional[int] = None

    @field_validator("reason")
    def reason_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("수정 사유를 입력해주세요.")
        return v.strip()


class UserAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str
    role: str
    is_verified: bool
    company_id: int
    company_name: str
    department: Optional[str] = None
    title: Optional[str] = None
    phone_office: Optional[str] = None
    phone_mobile: Optional[str] = None
    last_login_ip: Optional[str] = None
    created_at: datetime


class UserListResponse(BaseModel):
    items: list[UserAdminResponse]
    total: int
    page: int
    size: int


class PasswordResetResponse(BaseModel):
    temp_password: str
    message: str


class ConsultingReplySchema(BaseModel):
    reply: str

    @field_validator("reply")
    def reply_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("답변 내용을 입력해주세요.")
        return v.strip()


class ConsultingAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    name: str
    position: Optional[str] = None
    email: str
    title: str
    content: str
    status: str
    reply: Optional[str] = None
    replied_at: Optional[datetime] = None
    user_name: str
    company_name: str
    created_at: datetime


class ConsultingAdminListResponse(BaseModel):
    items: list[ConsultingAdminResponse]
    total: int
    page: int
    size: int


# ── Company schemas ──


class CompanyCreateSchema(BaseModel):
    name: str
    type: str  # seller | buyer | accountant

    @field_validator("name")
    def name_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("회사명을 입력해주세요.")
        return v.strip()


class CompanyUpdateSchema(BaseModel):
    reason: str
    name: Optional[str] = None
    type: Optional[str] = None

    @field_validator("reason")
    def reason_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("수정 사유를 입력해주세요.")
        return v.strip()


class CompanyAdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: str
    user_count: int = 0
    created_at: datetime


class CompanyListResponse(BaseModel):
    items: list[CompanyAdminResponse]
    total: int
    page: int
    size: int
