from datetime import datetime

from fastapi import HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.models.pool import Pool
from app.models.pool_company import PoolCompany
from app.models.user import User
from app.repositories.pool import PoolRepository
from app.schemas.pool import (
    PoolCreateSchema,
    PoolCompanyItem,
    PoolDetailResponse,
    PoolListItem,
    PoolListResponse,
    PoolUpdateSchema,
)

MASKED_ROLES = {"seller", "buyer"}


class PoolService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PoolRepository(db)

    async def get_list(
        self,
        user: User,
        status: str | None = None,
        page: int = 1,
        size: int = 20,
    ) -> PoolListResponse:
        pools, total = await self.repo.get_all(status=status, page=page, size=size)
        if not pools:
            return PoolListResponse(items=[], total=0, page=page, size=size)

        pool_ids = [p.id for p in pools]

        # Batch query participation for seller/buyer
        if user.role in MASKED_ROLES:
            participated_ids = await self.repo.get_participated_pool_ids(
                user.company_id, pool_ids
            )
        else:
            participated_ids = set(pool_ids)  # admin/accountant see all

        # Batch query companies
        companies_by_pool = await self.repo.get_companies_by_pool_ids(pool_ids)

        items = []
        for pool in pools:
            show = pool.id in participated_ids
            companies = companies_by_pool.get(pool.id, [])

            seller_name = next(
                (c["company_name"] for c in companies if c["role"] == "seller"), None
            ) if show else None
            buyer_name = next(
                (c["company_name"] for c in companies if c["role"] == "buyer"), None
            ) if show else None

            # can_view_detail logic
            if user.role in ("admin", "accountant"):
                can_view = True
            elif pool.status == "closed" and pool.id in participated_ids:
                can_view = True
            elif pool.status == "active":
                can_view = True
            else:
                can_view = False

            items.append(PoolListItem(
                id=pool.id,
                name=pool.name,
                status=pool.status,
                collateral_large=pool.collateral_large if show else None,
                collateral_small=pool.collateral_small if show else None,
                cutoff_date=pool.cutoff_date,
                bid_date=pool.bid_date,
                closing_date=pool.closing_date,
                seller_name=seller_name,
                buyer_name=buyer_name,
                opb=pool.opb,
                sale_price=pool.sale_price,
                sale_ratio=float(pool.sale_ratio) if pool.sale_ratio else None,
                remarks=pool.remarks,
                can_view_detail=can_view,
            ))

        return PoolListResponse(items=items, total=total, page=page, size=size)

    async def get_detail(self, pool_id: int, user: User) -> PoolDetailResponse:
        pool = await self.repo.get_or_404(pool_id)

        # admin/accountant: full access
        if user.role in ("admin", "accountant"):
            return await self._build_detail(pool)

        # cancelled: block
        if pool.status == "cancelled":
            raise HTTPException(403, "접근할 수 없는 거래입니다.")

        # closed: check participation
        if pool.status == "closed":
            participated = await self.repo.check_participation(pool_id, user.company_id)
            if not participated:
                raise HTTPException(403, "참여이력이 없는 거래입니다.")
            return await self._build_detail(pool)

        # active: masked
        return await self._build_detail(pool, mask=True)

    async def create(self, data: PoolCreateSchema, user: User) -> PoolDetailResponse:
        pool_data = data.model_dump(
            exclude_none=True,
            exclude={"seller_companies", "buyer_companies"},
        )
        pool = Pool(**pool_data, created_by=user.id)
        pool = await self.repo.create(pool)
        await self.db.flush()

        # Create pool_companies
        for sc in (data.seller_companies or []):
            self.db.add(PoolCompany(
                pool_id=pool.id, company_id=sc.company_id,
                role="seller", advisor=sc.advisor,
            ))
        for bc in (data.buyer_companies or []):
            self.db.add(PoolCompany(
                pool_id=pool.id, company_id=bc.company_id,
                role="buyer", advisor=bc.advisor,
                buyer_checklist_ok=bc.buyer_checklist_ok,
            ))

        await self.db.commit()
        await self.db.refresh(pool)
        return await self._build_detail(pool)

    async def update(
        self,
        pool_id: int,
        data: PoolUpdateSchema,
        user: User,
        request: Request,
    ) -> PoolDetailResponse:
        pool = await self.repo.get_or_404(pool_id)

        # Build old data for audit
        old_data = {
            c.key: getattr(pool, c.key)
            for c in Pool.__table__.columns
            if c.key != "sale_ratio"
        }
        # Serialize dates/datetimes to string for JSON
        for k, v in old_data.items():
            if hasattr(v, "isoformat"):
                old_data[k] = v.isoformat()

        # Apply updates
        update_data = data.model_dump(exclude_none=True, exclude={"reason"})
        for field, value in update_data.items():
            setattr(pool, field, value)
        pool.updated_by = user.id
        pool.updated_at = datetime.utcnow()

        # Build new data for audit
        new_data = {
            c.key: getattr(pool, c.key)
            for c in Pool.__table__.columns
            if c.key != "sale_ratio"
        }
        for k, v in new_data.items():
            if hasattr(v, "isoformat"):
                new_data[k] = v.isoformat()

        # Create audit log
        audit = AuditLog(
            table_name="pools",
            record_id=pool_id,
            action="UPDATE",
            reason=data.reason,
            old_data=old_data,
            new_data=new_data,
            performed_by=user.id,
            ip_address=request.client.host if request.client else "unknown",
        )
        self.db.add(audit)

        await self.db.commit()
        await self.db.refresh(pool)
        return await self._build_detail(pool)

    async def _build_detail(
        self, pool: Pool, mask: bool = False
    ) -> PoolDetailResponse:
        seller_companies = await self.repo.get_companies(pool.id, "seller")
        buyer_companies = await self.repo.get_companies(pool.id, "buyer")

        if mask:
            seller_companies = []
            buyer_companies = []

        return PoolDetailResponse(
            id=pool.id,
            name=pool.name,
            status=pool.status,
            cutoff_date=pool.cutoff_date,
            bid_date=pool.bid_date,
            closing_date=pool.closing_date,
            sale_method=pool.sale_method,
            bidder_count=pool.bidder_count,
            seller_companies=[PoolCompanyItem(**c) for c in seller_companies],
            buyer_companies=[PoolCompanyItem(**c) for c in buyer_companies],
            collateral_large=pool.collateral_large if not mask else None,
            collateral_small=pool.collateral_small if not mask else None,
            debtor_type=pool.debtor_type,
            debtor_count=pool.debtor_count,
            bond_count=pool.bond_count,
            avg_overdue_months=float(pool.avg_overdue_months) if pool.avg_overdue_months else None,
            opb=pool.opb,
            sale_price=pool.sale_price,
            sale_ratio=float(pool.sale_ratio) if pool.sale_ratio else None,
            resale_included=pool.resale_included,
            resale_debtor_count=pool.resale_debtor_count,
            resale_bond_count=pool.resale_bond_count,
            resale_opb=pool.resale_opb,
            remarks=pool.remarks,
            created_at=pool.created_at,
            updated_at=pool.updated_at,
        )
