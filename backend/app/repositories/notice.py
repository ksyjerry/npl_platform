from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.notice import Notice
from app.models.user import User


class NoticeRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self, pool_id: int | None = None, page: int = 1, size: int = 20
    ) -> tuple[list[dict], int]:
        query = (
            select(Notice, User.name.label("created_by_name"))
            .outerjoin(User, Notice.created_by == User.id)
        )
        count_query = select(func.count(Notice.id))

        if pool_id is not None:
            query = query.where(Notice.pool_id == pool_id)
            count_query = count_query.where(Notice.pool_id == pool_id)

        query = query.order_by(Notice.created_at.desc())
        query = query.offset((page - 1) * size).limit(size)

        result = await self.db.execute(query)
        rows = result.fetchall()

        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        items = []
        for notice, created_by_name in rows:
            items.append({
                "id": notice.id,
                "pool_id": notice.pool_id,
                "category": notice.category,
                "title": notice.title,
                "has_attachment": notice.file_name is not None,
                "created_by_name": created_by_name,
                "created_at": notice.created_at,
            })

        return items, total

    async def get_or_404(self, notice_id: int) -> Notice:
        result = await self.db.execute(
            select(Notice).where(Notice.id == notice_id)
        )
        notice = result.scalar_one_or_none()
        if not notice:
            raise HTTPException(404, "공지사항을 찾을 수 없습니다.")
        return notice

    async def create(self, notice: Notice) -> Notice:
        self.db.add(notice)
        await self.db.flush()
        return notice
