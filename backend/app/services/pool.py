from datetime import datetime
from decimal import Decimal

from fastapi import HTTPException, Request
from sqlalchemy import and_, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.models.bond import Bond
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
    PoolSellerItem,
    PoolSellerListResponse,
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
        name: str | None = None,
        seller_name: str | None = None,
        closing_from=None,
        closing_to=None,
        page: int = 1,
        size: int = 20,
    ) -> PoolListResponse:
        pools, total = await self.repo.get_all(
            status=status, name=name, seller_name=seller_name,
            closing_from=closing_from, closing_to=closing_to,
            page=page, size=size,
        )
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

            seller_names = [c["company_name"] for c in companies if c["role"] == "seller"] if show else None
            buyer_names = [c["company_name"] for c in companies if c["role"] == "buyer"] if show else None

            # can_view_detail logic
            if user.role in ("admin", "accountant"):
                can_view = True
            elif pool.status in ("closed", "cancelled") and pool.id in participated_ids:
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
                seller_name=seller_names,
                buyer_name=buyer_names,
                opb=pool.opb,
                sale_price=pool.sale_price,
                sale_ratio=float(pool.sale_ratio) if pool.sale_ratio else None,
                remarks=pool.remarks,
                can_view_detail=can_view,
            ))

        return PoolListResponse(items=items, total=total, page=page, size=size)

    async def get_seller_list(
        self,
        user: User,
        status: str | None = None,
        name: str | None = None,
        seller_name: str | None = None,
        closing_from=None,
        closing_to=None,
        page: int = 1,
        size: int = 20,
    ) -> PoolSellerListResponse:
        """Return a list where each row = one seller–pool pair."""
        pools, total_pools = await self.repo.get_all(
            status=status, name=name, seller_name=seller_name,
            closing_from=closing_from, closing_to=closing_to,
            page=1, size=9999,  # Get all matching pools, paginate seller rows below
        )
        if not pools:
            return PoolSellerListResponse(items=[], total=0, page=page, size=size)

        pool_ids = [p.id for p in pools]

        # Participation check for seller/buyer
        if user.role in MASKED_ROLES:
            participated_ids = await self.repo.get_participated_pool_ids(
                user.company_id, pool_ids
            )
        else:
            participated_ids = set(pool_ids)

        # Get all companies
        companies_by_pool = await self.repo.get_companies_by_pool_ids(pool_ids)

        # Build seller rows
        all_items: list[PoolSellerItem] = []
        for pool in pools:
            companies = companies_by_pool.get(pool.id, [])
            sellers = [c for c in companies if c["role"] == "seller"]

            if not sellers:
                continue

            show = pool.id in participated_ids

            # Can view detail logic
            if user.role in ("admin", "accountant"):
                can_view = True
            elif pool.status in ("closed", "cancelled") and pool.id in participated_ids:
                can_view = True
            elif pool.status == "active":
                can_view = True
            else:
                can_view = False

            buyer_names = [c["company_name"] for c in companies if c["role"] == "buyer"] if show else None

            for seller in sellers:
                # Seller can only see their own rows
                if user.role == "seller" and user.company_id != seller["company_id"]:
                    continue

                all_items.append(PoolSellerItem(
                    pool_id=pool.id,
                    pool_name=pool.name,
                    status=pool.status,
                    seller_company_id=seller["company_id"],
                    seller_name=seller["company_name"] if show else "—",
                    collateral_large=pool.collateral_large if show else None,
                    collateral_small=pool.collateral_small if show else None,
                    bid_date=pool.bid_date,
                    closing_date=pool.closing_date,
                    buyer_name=buyer_names,
                    opb=pool.opb if show else None,
                    sale_price=pool.sale_price if show else None,
                    sale_ratio=float(pool.sale_ratio) if pool.sale_ratio and show else None,
                    can_view_detail=can_view,
                ))

        # Sort by seller name
        all_items.sort(key=lambda x: x.seller_name)

        # Paginate
        total = len(all_items)
        start = (page - 1) * size
        paginated = all_items[start:start + size]

        return PoolSellerListResponse(items=paginated, total=total, page=page, size=size)

    async def get_detail(self, pool_id: int, user: User) -> PoolDetailResponse:
        pool = await self.repo.get_or_404(pool_id)

        # admin/accountant: full access
        if user.role in ("admin", "accountant"):
            return await self._build_detail(pool)

        # cancelled: check participation (same as closed)
        if pool.status == "cancelled":
            participated = await self.repo.check_participation(pool_id, user.company_id)
            if not participated:
                raise HTTPException(403, "접근할 수 없는 거래입니다.")
            return await self._build_detail(pool)

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

        # Apply updates (exclude company fields from pool column updates)
        update_data = data.model_dump(
            exclude_none=True,
            exclude={"reason", "seller_companies", "buyer_companies"},
        )
        for field, value in update_data.items():
            setattr(pool, field, value)
        pool.updated_by = user.id
        pool.updated_at = datetime.utcnow()

        # Update pool_companies if provided
        if data.seller_companies is not None:
            await self.db.execute(
                delete(PoolCompany).where(
                    PoolCompany.pool_id == pool_id,
                    PoolCompany.role == "seller",
                )
            )
            for sc in data.seller_companies:
                self.db.add(PoolCompany(
                    pool_id=pool_id, company_id=sc.company_id,
                    role="seller", advisor=sc.advisor,
                ))

        if data.buyer_companies is not None:
            await self.db.execute(
                delete(PoolCompany).where(
                    PoolCompany.pool_id == pool_id,
                    PoolCompany.role == "buyer",
                )
            )
            for bc in data.buyer_companies:
                self.db.add(PoolCompany(
                    pool_id=pool_id, company_id=bc.company_id,
                    role="buyer", advisor=bc.advisor,
                    buyer_checklist_ok=bc.buyer_checklist_ok,
                ))

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

    async def sync_from_bonds(
        self, pool_id: int, user: User, request: Request
    ) -> PoolDetailResponse:
        """Sync pool bond-info fields from imported bond data."""
        pool = await self.repo.get_or_404(pool_id)

        base = and_(Bond.pool_id == pool_id, Bond.is_deleted == False)

        # Total counts
        totals = await self.db.execute(
            select(
                func.count(func.distinct(Bond.debtor_id_masked)),
                func.count(Bond.id),
                func.coalesce(func.sum(Bond.opb), 0),
            ).where(base)
        )
        debtor_count, bond_count, total_opb = totals.one()

        # Distinct debtor types
        dt_result = await self.db.execute(
            select(Bond.debtor_type).where(base).where(Bond.debtor_type.isnot(None)).distinct()
        )
        debtor_types = [row[0] for row in dt_result.all()]

        # Resale: bonds with transfer_count >= 1
        resale = await self.db.execute(
            select(
                func.count(func.distinct(Bond.debtor_id_masked)),
                func.count(Bond.id),
                func.coalesce(func.sum(Bond.opb), 0),
            ).where(and_(base, Bond.transfer_count >= 1))
        )
        resale_debtor_count, resale_bond_count, resale_opb = resale.one()

        # Convert aggregates to plain int (avoid Decimal serialization issues)
        total_opb = int(total_opb)
        resale_opb = int(resale_opb)

        # Build old data for audit
        def _jsonable(v):
            if hasattr(v, "isoformat"):
                return v.isoformat()
            if isinstance(v, Decimal):
                return float(v)
            return v

        old_data = {
            k: _jsonable(v) for k, v in {
                "debtor_type": pool.debtor_type,
                "debtor_count": pool.debtor_count,
                "bond_count": pool.bond_count,
                "opb": pool.opb,
                "resale_included": pool.resale_included,
                "resale_debtor_count": pool.resale_debtor_count,
                "resale_bond_count": pool.resale_bond_count,
                "resale_opb": pool.resale_opb,
            }.items()
        }

        # Update pool
        pool.debtor_type = debtor_types if debtor_types else None
        pool.debtor_count = debtor_count
        pool.bond_count = bond_count
        pool.opb = total_opb
        pool.resale_included = resale_bond_count > 0
        pool.resale_debtor_count = resale_debtor_count if resale_bond_count > 0 else None
        pool.resale_bond_count = resale_bond_count if resale_bond_count > 0 else None
        pool.resale_opb = resale_opb if resale_bond_count > 0 else None
        pool.updated_by = user.id
        pool.updated_at = datetime.utcnow()

        new_data = {
            k: _jsonable(v) for k, v in {
                "debtor_type": pool.debtor_type,
                "debtor_count": pool.debtor_count,
                "bond_count": pool.bond_count,
                "opb": pool.opb,
                "resale_included": pool.resale_included,
                "resale_debtor_count": pool.resale_debtor_count,
                "resale_bond_count": pool.resale_bond_count,
                "resale_opb": pool.resale_opb,
            }.items()
        }

        audit = AuditLog(
            table_name="pools",
            record_id=pool_id,
            action="UPDATE",
            reason="채권 데이터 동기화 (Sync)",
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
