from typing import Optional

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies.auth import require_role
from app.core.database import get_db
from app.models.user import User
from app.schemas.admin import (
    CompanyAdminResponse,
    CompanyCreateSchema,
    CompanyListResponse,
    CompanyUpdateSchema,
    ConsultingAdminListResponse,
    ConsultingAdminResponse,
    ConsultingReplySchema,
    PasswordResetResponse,
    UserAdminResponse,
    UserListResponse,
    UserUpdateSchema,
)
from app.services.admin import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Users ──


@router.get("/users", response_model=UserListResponse)
async def list_users(
    role: Optional[str] = None,
    page: int = 1,
    size: int = 20,
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService(db).get_users(role=role, page=page, size=size)


@router.patch("/users/{user_id}", response_model=UserAdminResponse)
async def update_user(
    user_id: int,
    data: UserUpdateSchema,
    request: Request,
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService(db).update_user(user_id, data, admin, request)


@router.post("/users/{user_id}/reset-password", response_model=PasswordResetResponse)
async def reset_password(
    user_id: int,
    request: Request,
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService(db).reset_password(user_id, admin, request)


# ── Companies ──


@router.get("/companies", response_model=CompanyListResponse)
async def list_companies(
    type: Optional[str] = None,
    page: int = 1,
    size: int = 50,
    admin: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService(db).get_companies(type_filter=type, page=page, size=size)


@router.post("/companies", response_model=CompanyAdminResponse, status_code=201)
async def create_company(
    data: CompanyCreateSchema,
    request: Request,
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService(db).create_company(data, admin, request)


@router.patch("/companies/{company_id}", response_model=CompanyAdminResponse)
async def update_company(
    company_id: int,
    data: CompanyUpdateSchema,
    request: Request,
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService(db).update_company(company_id, data, admin, request)


@router.delete("/companies/{company_id}", status_code=204)
async def delete_company(
    company_id: int,
    request: Request,
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await AdminService(db).delete_company(company_id, admin, request)


# ── Consulting ──


@router.get("/consulting", response_model=ConsultingAdminListResponse)
async def list_consulting(
    type: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    size: int = 20,
    admin: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService(db).get_consultings(
        type_filter=type, status_filter=status, page=page, size=size
    )


@router.post(
    "/consulting/{consulting_id}/reply", response_model=ConsultingAdminResponse
)
async def reply_consulting(
    consulting_id: int,
    data: ConsultingReplySchema,
    request: Request,
    admin: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService(db).reply_consulting(consulting_id, data, admin, request)


# ── Pool Participants (CR-10) ──


@router.get("/pools/{pool_id}/participants")
async def list_pool_participants(
    pool_id: int,
    admin: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService(db).get_pool_participants(pool_id)


@router.post("/pools/{pool_id}/participants", status_code=201)
async def add_pool_participant(
    pool_id: int,
    data: dict,
    request: Request,
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    company_id = data.get("company_id")
    if not company_id:
        from fastapi import HTTPException
        raise HTTPException(422, "company_id가 필요합니다.")
    return await AdminService(db).add_pool_participant(pool_id, company_id, admin, request)


@router.delete("/pools/{pool_id}/participants/{company_id}", status_code=204)
async def remove_pool_participant(
    pool_id: int,
    company_id: int,
    request: Request,
    admin: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    await AdminService(db).remove_pool_participant(pool_id, company_id, admin, request)
