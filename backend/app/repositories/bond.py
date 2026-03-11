from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.bond import Bond


class BondRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_404(self, bond_id: int) -> Bond:
        result = await self.db.execute(
            select(Bond).where(and_(Bond.id == bond_id, Bond.is_deleted == False))
        )
        bond = result.scalar_one_or_none()
        if not bond:
            raise HTTPException(404, "채권을 찾을 수 없습니다.")
        return bond

    async def get_list(
        self,
        pool_id: int,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[Bond], int]:
        base = and_(Bond.pool_id == pool_id, Bond.is_deleted == False)

        query = (
            select(Bond)
            .where(base)
            .order_by(Bond.id.asc())
            .offset((page - 1) * size)
            .limit(size)
        )
        result = await self.db.execute(query)
        items = list(result.scalars().all())

        count_result = await self.db.execute(
            select(func.count(Bond.id)).where(base)
        )
        total = count_result.scalar() or 0

        return items, total

    async def create(self, bond: Bond) -> Bond:
        self.db.add(bond)
        await self.db.flush()
        return bond

    async def bulk_create(self, bonds: list[Bond]) -> None:
        self.db.add_all(bonds)
        await self.db.flush()
