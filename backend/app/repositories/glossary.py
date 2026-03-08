from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.glossary import Glossary


class GlossaryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[Glossary]:
        result = await self.db.execute(
            select(Glossary).order_by(Glossary.sort_order.asc())
        )
        return list(result.scalars().all())
