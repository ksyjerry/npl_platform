from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


class DocumentItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    pool_id: int
    pool_name: Optional[str] = None
    role_type: str
    company_name: Optional[str] = None
    uploader_name: Optional[str] = None
    file_name: str
    file_size: Optional[int] = None
    memo: Optional[str] = None
    created_at: Optional[datetime] = None


class DocumentListResponse(BaseModel):
    items: list[DocumentItem]
    total: int
    page: int
    size: int


class DocumentUploadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    file_name: str
    file_size: Optional[int] = None
    created_at: Optional[datetime] = None


class DocumentUpdateSchema(BaseModel):
    reason: str

    @field_validator("reason")
    @classmethod
    def reason_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("수정 사유를 입력해주세요.")
        return v.strip()

    memo: Optional[str] = None
