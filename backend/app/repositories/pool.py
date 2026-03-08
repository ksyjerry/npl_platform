from sqlalchemy import and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.models.pool import Pool
from app.models.pool_participant import PoolParticipant
from app.models.pool_company import PoolCompany
from app.models.company import Company


class PoolRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_404(self, pool_id: int) -> Pool:
        result = await self.db.execute(
            select(Pool).where(Pool.id == pool_id)
        )
        pool = result.scalar_one_or_none()
        if not pool:
            raise HTTPException(404, "Pool을 찾을 수 없습니다.")
        return pool

    async def get_all(
        self,
        status: str | None = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[Pool], int]:
        query = select(Pool)
        count_query = select(func.count(Pool.id))

        if status:
            query = query.where(Pool.status == status)
            count_query = count_query.where(Pool.status == status)

        # Sort: active(0) -> closed(1) -> cancelled(2), then by created_at DESC
        status_order = case(
            (Pool.status == "active", 0),
            (Pool.status == "closed", 1),
            else_=2,
        )
        query = query.order_by(status_order, Pool.created_at.desc())
        query = query.offset((page - 1) * size).limit(size)

        result = await self.db.execute(query)
        pools = list(result.scalars().all())

        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        return pools, total

    async def create(self, pool: Pool) -> Pool:
        self.db.add(pool)
        await self.db.flush()
        return pool

    async def check_participation(self, pool_id: int, company_id: int) -> bool:
        result = await self.db.execute(
            select(PoolParticipant).where(
                and_(
                    PoolParticipant.pool_id == pool_id,
                    PoolParticipant.company_id == company_id,
                )
            )
        )
        return result.scalar_one_or_none() is not None

    async def get_participated_pool_ids(
        self, company_id: int, pool_ids: list[int]
    ) -> set[int]:
        if not pool_ids:
            return set()
        result = await self.db.execute(
            select(PoolParticipant.pool_id).where(
                and_(
                    PoolParticipant.company_id == company_id,
                    PoolParticipant.pool_id.in_(pool_ids),
                )
            )
        )
        return {row[0] for row in result.fetchall()}

    async def get_companies(self, pool_id: int, role: str) -> list[dict]:
        result = await self.db.execute(
            select(PoolCompany, Company.name.label("company_name"))
            .join(Company, PoolCompany.company_id == Company.id)
            .where(
                and_(
                    PoolCompany.pool_id == pool_id,
                    PoolCompany.role == role,
                )
            )
        )
        rows = result.fetchall()
        return [
            {
                "name": cname,
                "advisor": pc.advisor,
                "checklist_ok": pc.buyer_checklist_ok,
            }
            for pc, cname in rows
        ]

    async def get_companies_by_pool_ids(
        self, pool_ids: list[int]
    ) -> dict[int, list[dict]]:
        if not pool_ids:
            return {}
        result = await self.db.execute(
            select(PoolCompany, Company.name.label("company_name"))
            .join(Company, PoolCompany.company_id == Company.id)
            .where(PoolCompany.pool_id.in_(pool_ids))
        )
        rows = result.fetchall()
        out: dict[int, list[dict]] = {}
        for pc, cname in rows:
            out.setdefault(pc.pool_id, []).append(
                {"role": pc.role, "company_name": cname}
            )
        return out
