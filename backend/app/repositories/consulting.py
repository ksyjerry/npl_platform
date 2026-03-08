from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.consulting import Consulting


class ConsultingRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, consulting: Consulting) -> Consulting:
        self.db.add(consulting)
        await self.db.flush()
        return consulting

    async def get_list(
        self,
        user_id: int | None = None,
        type_filter: str | None = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[Consulting], int]:
        query = select(Consulting)
        count_query = select(func.count(Consulting.id))

        if user_id is not None:
            query = query.where(Consulting.user_id == user_id)
            count_query = count_query.where(Consulting.user_id == user_id)

        if type_filter:
            query = query.where(Consulting.type == type_filter)
            count_query = count_query.where(Consulting.type == type_filter)

        query = query.order_by(Consulting.created_at.desc())
        query = query.offset((page - 1) * size).limit(size)

        result = await self.db.execute(query)
        items = list(result.scalars().all())

        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        return items, total

    async def get_or_404(self, consulting_id: int) -> Consulting:
        result = await self.db.execute(
            select(Consulting).where(Consulting.id == consulting_id)
        )
        consulting = result.scalar_one_or_none()
        if not consulting:
            raise HTTPException(404, "상담을 찾을 수 없습니다.")
        return consulting
