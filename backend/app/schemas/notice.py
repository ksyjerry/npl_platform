from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


class NoticeCreate(BaseModel):
    pool_id: Optional[int] = None
    category: str
    title: str
    content: str


class NoticeUpdate(BaseModel):
    reason: str

    @field_validator("reason")
    @classmethod
    def reason_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("수정 사유를 입력해주세요.")
        return v.strip()

    pool_id: Optional[int] = None
    category: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None


class NoticeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    pool_id: Optional[int] = None
    category: Optional[str] = None
    title: str
    has_attachment: bool = False
    created_by_name: Optional[str] = None
    created_at: Optional[datetime] = None


class NoticeDetail(NoticeResponse):
    content: Optional[str] = None
    attachment_doc_id: Optional[int] = None
    attachment_name: Optional[str] = None


class NoticeListResponse(BaseModel):
    items: list[NoticeResponse]
    total: int
    page: int
    size: int
