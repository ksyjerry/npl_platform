from fastapi import APIRouter, Depends, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies.auth import require_role
from app.core.database import get_db
from app.models.user import User
from app.schemas.bond import (
    BondDeleteSchema,
    BondDetailResponse,
    BondImportResult,
    BondListResponse,
    BondResponse,
    BondSummary,
    BondUpdate,
)
from app.services.bond import BondService
from app.services.bond_import import generate_template, get_template, import_excel, BOND_TYPES

router = APIRouter(prefix="/bonds", tags=["bonds"])


@router.get("", response_model=BondListResponse)
async def list_bonds(
    pool_id: int,
    bond_type: str | None = None,
    page: int = 1,
    size: int = 20,
    include_extra: bool = False,
    user: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db),
):
    return await BondService(db).get_list(
        pool_id=pool_id, bond_type=bond_type, page=page, size=size, include_extra=include_extra
    )


@router.get("/detail/{bond_id}", response_model=BondDetailResponse)
async def get_bond_detail(
    bond_id: int,
    user: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db),
):
    return await BondService(db).get_detail(bond_id)


@router.get("/template")
async def download_template(
    bond_type: str = "A",
    user: User = Depends(require_role("admin", "accountant")),
):
    return get_template(bond_type)


@router.get("/types")
async def list_bond_types(
    user: User = Depends(require_role("admin", "accountant")),
):
    return [{"value": k, "label": v} for k, v in BOND_TYPES.items()]


@router.post("/import", response_model=BondImportResult, status_code=201)
async def import_bonds(
    pool_id: int,
    file: UploadFile,
    bond_type: str = "A",
    user: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db),
):
    return await import_excel(file, pool_id, user, db, bond_type=bond_type)


@router.patch("/{bond_id}", response_model=BondResponse)
async def update_bond(
    bond_id: int,
    data: BondUpdate,
    request: Request,
    user: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db),
):
    return await BondService(db).update(bond_id, data, user, request)


@router.delete("/{bond_id}", status_code=204)
async def delete_bond(
    bond_id: int,
    data: BondDeleteSchema,
    request: Request,
    user: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db),
):
    await BondService(db).delete(bond_id, data, user, request)


@router.get("/summary", response_model=BondSummary)
async def bond_summary(
    pool_id: int,
    user: User = Depends(require_role("admin", "accountant", "seller", "buyer")),
    db: AsyncSession = Depends(get_db),
):
    return await BondService(db).get_summary(pool_id)
