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
    PoolSellerListResponse,
    PoolUpdateSchema,
)
from app.services.pool import PoolService

router = APIRouter(prefix="/pools", tags=["pools"])


@router.get("", response_model=PoolListResponse)
async def list_pools(
    status: Optional[str] = None,
    name: Optional[str] = None,
    seller_name: Optional[str] = None,
    closing_from: Optional[date] = None,
    closing_to: Optional[date] = None,
    page: int = 1,
    size: int = 20,
    user: User = Depends(require_role("admin", "accountant", "seller", "buyer")),
    db: AsyncSession = Depends(get_db),
):
    return await PoolService(db).get_list(
        user, status=status, name=name, seller_name=seller_name,
        closing_from=closing_from, closing_to=closing_to,
        page=page, size=size,
    )


@router.get("/by-seller", response_model=PoolSellerListResponse)
async def list_pools_by_seller(
    status: Optional[str] = None,
    name: Optional[str] = None,
    seller_name: Optional[str] = None,
    closing_from: Optional[date] = None,
    closing_to: Optional[date] = None,
    page: int = 1,
    size: int = 20,
    user: User = Depends(require_role("admin", "accountant", "seller", "buyer")),
    db: AsyncSession = Depends(get_db),
):
    return await PoolService(db).get_seller_list(
        user, status=status, name=name, seller_name=seller_name,
        closing_from=closing_from, closing_to=closing_to,
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


@router.post("/{pool_id}/sync-bonds", response_model=PoolDetailResponse)
async def sync_pool_from_bonds(
    pool_id: int,
    request: Request,
    user: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db),
):
    """Sync pool's bond info fields from imported bond data."""
    return await PoolService(db).sync_from_bonds(pool_id, user, request)


@router.patch("/{pool_id}", response_model=PoolDetailResponse)
async def update_pool(
    pool_id: int,
    data: PoolUpdateSchema,
    request: Request,
    user: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db),
):
    return await PoolService(db).update(pool_id, data, user, request)
