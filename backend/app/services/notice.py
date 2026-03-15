from datetime import datetime
from urllib.parse import quote
from uuid import uuid4

from fastapi import HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crypto import decrypt_path, encrypt_path
from app.core.file_validator import validate_upload
from app.models.audit_log import AuditLog
from app.models.notice import Notice
from app.models.notice_file import NoticeFile
from app.models.user import User
from app.repositories.notice import NoticeRepository
from app.schemas.notice import (
    NoticeCreate,
    NoticeDetail,
    NoticeFileResponse,
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

        # Get attached files (notice_files table)
        files_result = await self.db.execute(
            select(NoticeFile)
            .where(NoticeFile.notice_id == notice_id)
            .order_by(NoticeFile.sort_order)
        )
        notice_files = [
            NoticeFileResponse(id=f.id, file_name=f.file_name, file_size=f.file_size)
            for f in files_result.scalars().all()
        ]

        # Backward compat: check legacy single-file fields
        has_attachment = notice.file_name is not None or len(notice_files) > 0

        return NoticeDetail(
            id=notice.id,
            pool_id=notice.pool_id,
            category=notice.category,
            title=notice.title,
            content=notice.content,
            has_attachment=has_attachment,
            attachment_name=notice.file_name,
            files=notice_files,
            created_by_name=creator_name,
            created_at=notice.created_at,
        )

    async def create(
        self,
        data: NoticeCreate,
        user: User,
        request: Request,
        files: list[UploadFile] | None = None,
    ) -> NoticeResponse:
        # Legacy single-file support: keep first file in notice table for backward compat
        file_name = None
        file_path_enc = None

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
        await self.db.flush()

        # Save multiple files to notice_files table
        has_files = False
        if files and self.storage:
            for idx, file in enumerate(files):
                if not file.filename:
                    continue
                content = await file.read()
                validate_upload(file.filename, content)
                path = f"notices/{uuid4()}_{file.filename}"
                await self.storage.save(path, content)

                nf = NoticeFile(
                    notice_id=notice.id,
                    file_name=file.filename,
                    file_path_enc=encrypt_path(path),
                    file_size=len(content),
                    sort_order=idx,
                )
                self.db.add(nf)
                has_files = True

                # Keep first file in legacy fields for backward compat
                if idx == 0:
                    notice.file_name = file.filename
                    notice.file_path_enc = encrypt_path(path)

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
            has_attachment=has_files,
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

    async def delete_file(
        self, notice_id: int, file_id: int, user: User, request: Request
    ) -> None:
        if not self.storage:
            raise HTTPException(500, "파일 스토리지가 설정되지 않았습니다.")

        result = await self.db.execute(
            select(NoticeFile).where(
                NoticeFile.id == file_id,
                NoticeFile.notice_id == notice_id,
            )
        )
        nf = result.scalar_one_or_none()
        if not nf:
            raise HTTPException(404, "파일을 찾을 수 없습니다.")

        # Delete from storage
        path = decrypt_path(nf.file_path_enc)
        try:
            await self.storage.delete(path)
        except Exception:
            pass  # file may already be missing

        # Audit log
        audit = AuditLog(
            table_name="notice_files",
            record_id=file_id,
            action="DELETE",
            reason="첨부파일 삭제",
            old_data={"file_name": nf.file_name, "notice_id": notice_id},
            performed_by=user.id,
            ip_address=request.client.host if request.client else "unknown",
        )
        self.db.add(audit)
        await self.db.delete(nf)
        await self.db.commit()

    async def add_files(
        self,
        notice_id: int,
        files: list[UploadFile],
        user: User,
        request: Request,
    ) -> dict:
        if not self.storage:
            raise HTTPException(500, "파일 스토리지가 설정되지 않았습니다.")

        notice = await self.repo.get_or_404(notice_id)

        # Get current max sort_order
        result = await self.db.execute(
            select(NoticeFile.sort_order)
            .where(NoticeFile.notice_id == notice_id)
            .order_by(NoticeFile.sort_order.desc())
        )
        max_order = result.scalar_one_or_none() or 0

        added = []
        for idx, file in enumerate(files):
            if not file.filename:
                continue
            content = await file.read()
            validate_upload(file.filename, content)
            path = f"notices/{uuid4()}_{file.filename}"
            await self.storage.save(path, content)

            nf = NoticeFile(
                notice_id=notice_id,
                file_name=file.filename,
                file_path_enc=encrypt_path(path),
                file_size=len(content),
                sort_order=max_order + idx + 1,
            )
            self.db.add(nf)
            added.append(file.filename)

        # Audit log
        audit = AuditLog(
            table_name="notice_files",
            record_id=notice_id,
            action="CREATE",
            reason="첨부파일 추가",
            new_data={"files": added},
            performed_by=user.id,
            ip_address=request.client.host if request.client else "unknown",
        )
        self.db.add(audit)
        await self.db.commit()

        return {"message": f"{len(added)}개 파일이 추가되었습니다.", "count": len(added)}

    async def download_file(
        self, notice_id: int, file_id: int
    ) -> StreamingResponse:
        if not self.storage:
            raise HTTPException(500, "파일 스토리지가 설정되지 않았습니다.")

        result = await self.db.execute(
            select(NoticeFile).where(
                NoticeFile.id == file_id,
                NoticeFile.notice_id == notice_id,
            )
        )
        nf = result.scalar_one_or_none()
        if not nf:
            raise HTTPException(404, "파일을 찾을 수 없습니다.")

        path = decrypt_path(nf.file_path_enc)
        stream = await self.storage.read_stream(path)

        return StreamingResponse(
            stream,
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{quote(nf.file_name)}"
            },
        )
