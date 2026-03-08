from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict


class ConsultingCreate(BaseModel):
    type: Literal["selling", "buying"]
    name: str
    position: Optional[str] = None
    email: str
    title: str
    content: str


class ConsultingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    type: str
    name: str
    position: Optional[str] = None
    email: str
    title: str
    status: str
    created_at: Optional[datetime] = None


class ConsultingDetail(ConsultingResponse):
    content: str
    reply: Optional[str] = None
    replied_at: Optional[datetime] = None
    user_name: Optional[str] = None
    company_name: Optional[str] = None


class ConsultingListResponse(BaseModel):
    items: list[ConsultingResponse]
    total: int
    page: int
    size: int
