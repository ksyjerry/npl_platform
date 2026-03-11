from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.document import Document
from app.models.pool import Pool
from app.models.user import User
from app.models.company import Company


class DocumentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_404(self, doc_id: int) -> Document:
        result = await self.db.execute(
            select(Document).where(Document.id == doc_id)
        )
        doc = result.scalar_one_or_none()
        if not doc:
            raise HTTPException(404, "문서를 찾을 수 없습니다.")
        return doc

    async def get_list(
        self,
        role_type: str,
        pool_id: int | None = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[dict], int]:
        """Get documents with joined pool_name, company_name, uploader_name."""
        query = (
            select(
                Document,
                Pool.name.label("pool_name"),
                User.name.label("uploader_name"),
                Company.name.label("company_name"),
            )
            .join(Pool, Document.pool_id == Pool.id)
            .join(User, Document.uploader_id == User.id)
            .join(Company, User.company_id == Company.id)
            .where(Document.role_type == role_type)
        )

        count_query = (
            select(func.count(Document.id))
            .where(Document.role_type == role_type)
        )

        if pool_id:
            query = query.where(Document.pool_id == pool_id)
            count_query = count_query.where(Document.pool_id == pool_id)

        query = query.order_by(Document.created_at.desc())
        query = query.offset((page - 1) * size).limit(size)

        result = await self.db.execute(query)
        rows = result.fetchall()

        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        items = []
        for doc, pool_name, uploader_name, company_name in rows:
            items.append({
                "id": doc.id,
                "pool_id": doc.pool_id,
                "pool_name": pool_name,
                "role_type": doc.role_type,
                "company_name": company_name,
                "uploader_name": uploader_name,
                "file_name": doc.file_name,
                "file_size": doc.file_size,
                "memo": doc.memo,
                "uploader_id": doc.uploader_id,
                "created_at": doc.created_at,
            })

        return items, total

    async def create(self, doc: Document) -> Document:
        self.db.add(doc)
        await self.db.flush()
        return doc
