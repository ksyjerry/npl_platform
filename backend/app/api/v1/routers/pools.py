from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies.auth import get_current_user, require_role
from app.core.database import get_db
from app.models.user import User
from app.schemas.pool import (
    PoolCreateSchema,
    PoolDetailResponse,
    PoolListResponse,
    PoolUpdateSchema,
)
from app.services.pool import PoolService

router = APIRouter(prefix="/pools", tags=["pools"])


@router.get("", response_model=PoolListResponse)
async def list_pools(
    status: Optional[str] = None,
    name: Optional[str] = None,
    seller_name: Optional[str] = None,
    cutoff_from: Optional[date] = None,
    cutoff_to: Optional[date] = None,
    page: int = 1,
    size: int = 20,
    user: User = Depends(require_role("admin", "accountant", "seller", "buyer")),
    db: AsyncSession = Depends(get_db),
):
    return await PoolService(db).get_list(
        user, status=status, name=name, seller_name=seller_name,
        cutoff_from=cutoff_from, cutoff_to=cutoff_to,
        page=page, size=size,
    )


@router.post("", response_model=PoolDetailResponse, status_code=201)
async def create_pool(
    data: PoolCreateSchema,
    user: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db),
):
    return await PoolService(db).create(data, user)


@router.get("/{pool_id}", response_model=PoolDetailResponse)
async def get_pool(
    pool_id: int,
    user: User = Depends(require_role("admin", "accountant", "seller", "buyer")),
    db: AsyncSession = Depends(get_db),
):
    return await PoolService(db).get_detail(pool_id, user)


@router.patch("/{pool_id}", response_model=PoolDetailResponse)
async def update_pool(
    pool_id: int,
    data: PoolUpdateSchema,
    request: Request,
    user: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db),
):
    return await PoolService(db).update(pool_id, data, user, request)
