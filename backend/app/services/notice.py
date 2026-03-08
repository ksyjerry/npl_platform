from datetime import datetime

from fastapi import HTTPException, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crypto import encrypt_path
from app.core.file_validator import validate_upload
from app.models.audit_log import AuditLog
from app.models.notice import Notice
from app.models.user import User
from app.repositories.notice import NoticeRepository
from app.schemas.notice import (
    NoticeCreate,
    NoticeDetail,
    NoticeListResponse,
    NoticeResponse,
    NoticeUpdate,
)
from app.services.file_storage import FileStorageService


class NoticeService:
    def __init__(self, db: AsyncSession, storage: FileStorageService | None = None):
        self.db = db
        self.repo = NoticeRepository(db)
        self.storage = storage

    async def get_notices(
        self, pool_id: int | None = None, page: int = 1, size: int = 20
    ) -> NoticeListResponse:
        items, total = await self.repo.get_all(pool_id=pool_id, page=page, size=size)
        return NoticeListResponse(
            items=[NoticeResponse(**item) for item in items],
            total=total,
            page=page,
            size=size,
        )

    async def get_detail(self, notice_id: int) -> NoticeDetail:
        notice = await self.repo.get_or_404(notice_id)
        # Get creator name
        result = await self.db.execute(
            select(User.name).where(User.id == notice.created_by)
        )
        creator_name = result.scalar_one_or_none()

        return NoticeDetail(
            id=notice.id,
            pool_id=notice.pool_id,
            category=notice.category,
            title=notice.title,
            content=notice.content,
            has_attachment=notice.file_name is not None,
            attachment_name=notice.file_name,
            created_by_name=creator_name,
            created_at=notice.created_at,
        )

    async def create(
        self,
        data: NoticeCreate,
        user: User,
        request: Request,
        file: UploadFile | None = None,
    ) -> NoticeResponse:
        file_name = None
        file_path_enc = None

        if file and file.filename and self.storage:
            content = await file.read()
            validate_upload(file.filename, content)
            from uuid import uuid4
            path = f"notices/{uuid4()}_{file.filename}"
            await self.storage.save(path, content)
            file_name = file.filename
            file_path_enc = encrypt_path(path)

        notice = Notice(
            pool_id=data.pool_id,
            category=data.category,
            title=data.title,
            content=data.content,
            file_name=file_name,
            file_path_enc=file_path_enc,
            created_by=user.id,
        )
        notice = await self.repo.create(notice)

        # Audit log
        audit = AuditLog(
            table_name="notices",
            record_id=notice.id,
            action="CREATE",
            new_data={"title": notice.title, "category": notice.category},
            performed_by=user.id,
            ip_address=request.client.host if request.client else "unknown",
        )
        self.db.add(audit)
        await self.db.commit()

        return NoticeResponse(
            id=notice.id,
            pool_id=notice.pool_id,
            category=notice.category,
            title=notice.title,
            has_attachment=file_name is not None,
            created_at=notice.created_at,
        )

    async def update(
        self,
        notice_id: int,
        data: NoticeUpdate,
        user: User,
        request: Request,
    ) -> NoticeDetail:
        notice = await self.repo.get_or_404(notice_id)

        old_data = {"title": notice.title, "category": notice.category, "content": notice.content}

        update_fields = data.model_dump(exclude_none=True, exclude={"reason"})
        for field, value in update_fields.items():
            setattr(notice, field, value)
        notice.updated_at = datetime.utcnow()

        new_data = {"title": notice.title, "category": notice.category, "content": notice.content}

        audit = AuditLog(
            table_name="notices",
            record_id=notice_id,
            action="UPDATE",
            reason=data.reason,
            old_data=old_data,
            new_data=new_data,
            performed_by=user.id,
            ip_address=request.client.host if request.client else "unknown",
        )
        self.db.add(audit)
        await self.db.commit()

        return await self.get_detail(notice_id)

    async def delete(
        self,
        notice_id: int,
        reason: str,
        user: User,
        request: Request,
    ) -> None:
        notice = await self.repo.get_or_404(notice_id)

        if not reason or not reason.strip():
            raise HTTPException(422, "삭제 사유를 입력해주세요.")

        audit = AuditLog(
            table_name="notices",
            record_id=notice_id,
            action="DELETE",
            reason=reason.strip(),
            old_data={"title": notice.title, "category": notice.category},
            performed_by=user.id,
            ip_address=request.client.host if request.client else "unknown",
        )
        self.db.add(audit)
        await self.db.delete(notice)
        await self.db.commit()
