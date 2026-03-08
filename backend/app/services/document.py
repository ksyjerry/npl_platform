from datetime import datetime
from urllib.parse import quote

from fastapi import HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crypto import decrypt_path, encrypt_path
from app.core.file_validator import validate_upload
from app.models.audit_log import AuditLog
from app.models.document import Document
from app.models.user import User
from app.repositories.document import DocumentRepository
from app.schemas.document import (
    DocumentItem,
    DocumentListResponse,
    DocumentUpdateSchema,
    DocumentUploadResponse,
)
from app.services.file_storage import FileStorageService

# role_type access matrix
ROLE_ACCESS = {
    "seller": ["seller", "accountant", "admin"],
    "buyer": ["buyer", "accountant", "admin"],
    "accountant": ["accountant", "admin"],
}


class DocumentService:
    def __init__(self, db: AsyncSession, storage: FileStorageService):
        self.db = db
        self.repo = DocumentRepository(db)
        self.storage = storage

    async def get_list(
        self,
        user: User,
        role_type: str,
        pool_id: int | None = None,
        page: int = 1,
        size: int = 20,
    ) -> DocumentListResponse:
        # Check role access
        if user.role not in ROLE_ACCESS.get(role_type, []):
            raise HTTPException(403, "해당 유형 자료에 접근할 권한이 없습니다.")

        items, total = await self.repo.get_list(
            role_type=role_type, pool_id=pool_id, page=page, size=size
        )
        return DocumentListResponse(
            items=[DocumentItem(**item) for item in items],
            total=total,
            page=page,
            size=size,
        )

    async def upload(
        self,
        file: UploadFile,
        pool_id: int,
        role_type: str,
        memo: str | None,
        user: User,
        request: Request,
    ) -> DocumentUploadResponse:
        # Check role access
        if user.role not in ROLE_ACCESS.get(role_type, []):
            raise HTTPException(403, "해당 유형 파일을 업로드할 권한이 없습니다.")

        # Read and validate file
        content = await file.read()
        filename = file.filename or "unknown"
        validate_upload(filename, content)

        # Build path and save
        path = self.storage.build_path(pool_id, role_type, filename)
        await self.storage.save(path, content)

        # Save to DB with encrypted path
        doc = Document(
            pool_id=pool_id,
            uploader_id=user.id,
            role_type=role_type,
            file_name=filename,
            file_path_enc=encrypt_path(path),
            file_size=len(content),
            memo=memo,
        )
        doc = await self.repo.create(doc)

        # Audit log
        audit = AuditLog(
            table_name="documents",
            record_id=doc.id,
            action="CREATE",
            new_data={
                "file_name": doc.file_name,
                "role_type": role_type,
                "pool_id": pool_id,
                "file_size": len(content),
            },
            performed_by=user.id,
            ip_address=request.client.host if request.client else "unknown",
        )
        self.db.add(audit)
        await self.db.commit()

        return DocumentUploadResponse(
            id=doc.id,
            file_name=doc.file_name,
            file_size=doc.file_size,
            created_at=doc.created_at,
        )

    async def download(self, doc_id: int, user: User) -> StreamingResponse:
        doc = await self.repo.get_or_404(doc_id)

        # Check role access
        if user.role not in ROLE_ACCESS.get(doc.role_type, []):
            raise HTTPException(403, "파일 다운로드 권한이 없습니다.")

        # Decrypt path and stream
        path = decrypt_path(doc.file_path_enc)
        stream = await self.storage.read_stream(path)

        return StreamingResponse(
            stream,
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{quote(doc.file_name)}"
            },
        )

    async def update(
        self,
        doc_id: int,
        data: DocumentUpdateSchema,
        user: User,
        request: Request,
    ) -> DocumentItem:
        doc = await self.repo.get_or_404(doc_id)

        # Only uploader or admin/accountant can update
        if doc.uploader_id != user.id and user.role not in ("admin", "accountant"):
            raise HTTPException(403, "수정 권한이 없습니다.")

        old_data = {"memo": doc.memo}

        if data.memo is not None:
            doc.memo = data.memo
        doc.updated_at = datetime.utcnow()

        new_data = {"memo": doc.memo}

        # Audit log
        audit = AuditLog(
            table_name="documents",
            record_id=doc.id,
            action="UPDATE",
            reason=data.reason,
            old_data=old_data,
            new_data=new_data,
            performed_by=user.id,
            ip_address=request.client.host if request.client else "unknown",
        )
        self.db.add(audit)
        await self.db.commit()

        # Return with joined data — simple approach
        return DocumentItem(
            id=doc.id,
            pool_id=doc.pool_id,
            role_type=doc.role_type,
            file_name=doc.file_name,
            file_size=doc.file_size,
            memo=doc.memo,
            created_at=doc.created_at,
        )
