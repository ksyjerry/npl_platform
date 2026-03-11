from typing import Optional

from fastapi import APIRouter, Depends, Form, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies.auth import get_current_user, require_role
from app.core.database import get_db
from app.models.user import User
from app.schemas.document import (
    DocumentDeleteSchema,
    DocumentItem,
    DocumentListResponse,
    DocumentUpdateSchema,
    DocumentUploadResponse,
)
from app.services.document import DocumentService
from app.services.file_storage import FileStorageService, get_storage

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    role_type: str,
    pool_id: Optional[int] = None,
    page: int = 1,
    size: int = 20,
    user: User = Depends(require_role("admin", "accountant", "seller", "buyer")),
    db: AsyncSession = Depends(get_db),
    storage: FileStorageService = Depends(get_storage),
):
    return await DocumentService(db, storage).get_list(
        user, role_type=role_type, pool_id=pool_id, page=page, size=size
    )


@router.post("/upload", response_model=DocumentUploadResponse, status_code=201)
async def upload_document(
    request: Request,
    file: UploadFile,
    pool_id: int = Form(...),
    role_type: str = Form(...),
    memo: Optional[str] = Form(None),
    user: User = Depends(require_role("admin", "accountant", "seller", "buyer")),
    db: AsyncSession = Depends(get_db),
    storage: FileStorageService = Depends(get_storage),
):
    return await DocumentService(db, storage).upload(
        file, pool_id, role_type, memo, user, request
    )


@router.get("/{doc_id}/download")
async def download_document(
    doc_id: int,
    user: User = Depends(require_role("admin", "accountant", "seller", "buyer")),
    db: AsyncSession = Depends(get_db),
    storage: FileStorageService = Depends(get_storage),
):
    return await DocumentService(db, storage).download(doc_id, user)


@router.patch("/{doc_id}", response_model=DocumentItem)
async def update_document(
    doc_id: int,
    data: DocumentUpdateSchema,
    request: Request,
    user: User = Depends(require_role("admin", "accountant", "seller", "buyer")),
    db: AsyncSession = Depends(get_db),
    storage: FileStorageService = Depends(get_storage),
):
    return await DocumentService(db, storage).update(doc_id, data, user, request)


@router.delete("/{doc_id}", status_code=204)
async def delete_document(
    doc_id: int,
    data: DocumentDeleteSchema,
    request: Request,
    user: User = Depends(require_role("admin", "accountant", "seller", "buyer")),
    db: AsyncSession = Depends(get_db),
    storage: FileStorageService = Depends(get_storage),
):
    await DocumentService(db, storage).delete(doc_id, data, user, request)
