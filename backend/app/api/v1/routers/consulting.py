from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.consulting import ConsultingCreate, ConsultingListResponse, ConsultingResponse
from app.services.consulting import ConsultingService

router = APIRouter(prefix="/consulting", tags=["consulting"])


@router.post("", response_model=ConsultingResponse, status_code=201)
async def submit_consulting(
    data: ConsultingCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ConsultingService(db).submit(data, user)


@router.get("", response_model=ConsultingListResponse)
async def list_consulting(
    type: Optional[str] = None,
    page: int = 1,
    size: int = 20,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ConsultingService(db).get_list(user, type_filter=type, page=page, size=size)
