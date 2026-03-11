from typing import Optional

from fastapi import APIRouter, Depends, Form, Request, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies.auth import get_current_user, require_role
from app.core.database import get_db
from app.models.user import User
from app.schemas.notice import NoticeDetail, NoticeListResponse, NoticeResponse, NoticeUpdate
from app.services.notice import NoticeService
from app.services.file_storage import FileStorageService, get_storage

router = APIRouter(prefix="/notices", tags=["notices"])


@router.get("", response_model=NoticeListResponse)
async def list_notices(
    pool_id: Optional[int] = None,
    page: int = 1,
    size: int = 20,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await NoticeService(db).get_notices(pool_id=pool_id, page=page, size=size)


@router.get("/{notice_id}", response_model=NoticeDetail)
async def get_notice(
    notice_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await NoticeService(db).get_detail(notice_id)


@router.post("", response_model=NoticeResponse, status_code=201)
async def create_notice(
    request: Request,
    title: str = Form(...),
    content: str = Form(...),
    category: str = Form("전체"),
    pool_id: Optional[int] = Form(None),
    files: list[UploadFile] = File(default=[]),
    user: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db),
    storage: FileStorageService = Depends(get_storage),
):
    from app.schemas.notice import NoticeCreate
    data = NoticeCreate(pool_id=pool_id, category=category, title=title, content=content)
    return await NoticeService(db, storage).create(data, user, request, files)


@router.patch("/{notice_id}", response_model=NoticeDetail)
async def update_notice(
    notice_id: int,
    data: NoticeUpdate,
    request: Request,
    user: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db),
):
    return await NoticeService(db).update(notice_id, data, user, request)


@router.delete("/{notice_id}")
async def delete_notice(
    notice_id: int,
    request: Request,
    reason: str = "",
    user: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db),
):
    await NoticeService(db).delete(notice_id, reason, user, request)
    return {"message": "삭제되었습니다."}


@router.get("/{notice_id}/files/{file_id}/download")
async def download_notice_file(
    notice_id: int,
    file_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: FileStorageService = Depends(get_storage),
):
    return await NoticeService(db, storage).download_file(notice_id, file_id)
