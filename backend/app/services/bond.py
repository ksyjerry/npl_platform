from datetime import datetime

from fastapi import HTTPException, Request
from sqlalchemy import and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.models.bond import Bond
from app.models.user import User
from app.repositories.bond import BondRepository
from app.schemas.bond import (
    BondDeleteSchema,
    BondListResponse,
    BondResponse,
    BondSummary,
    BondSummaryCategory,
    BondUpdate,
)


class BondService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BondRepository(db)

    async def get_list(
        self, pool_id: int, page: int = 1, size: int = 20
    ) -> BondListResponse:
        items, total = await self.repo.get_list(pool_id=pool_id, page=page, size=size)
        return BondListResponse(
            items=[BondResponse.model_validate(b) for b in items],
            total=total,
            page=page,
            size=size,
        )

    async def update(
        self, bond_id: int, data: BondUpdate, user: User, request: Request
    ) -> BondResponse:
        bond = await self.repo.get_or_404(bond_id)

        old_data = {
            c.key: getattr(bond, c.key)
            for c in Bond.__table__.columns
            if c.key not in ("id", "created_at", "is_deleted")
        }
        for k, v in old_data.items():
            if hasattr(v, "isoformat"):
                old_data[k] = v.isoformat()

        update_fields = data.model_dump(exclude_none=True, exclude={"reason"})
        for field, value in update_fields.items():
            setattr(bond, field, value)
        bond.updated_at = datetime.utcnow()

        new_data = {
            c.key: getattr(bond, c.key)
            for c in Bond.__table__.columns
            if c.key not in ("id", "created_at", "is_deleted")
        }
        for k, v in new_data.items():
            if hasattr(v, "isoformat"):
                new_data[k] = v.isoformat()

        audit = AuditLog(
            table_name="bonds",
            record_id=bond_id,
            action="UPDATE",
            reason=data.reason,
            old_data=old_data,
            new_data=new_data,
            performed_by=user.id,
            ip_address=request.client.host if request.client else "unknown",
        )
        self.db.add(audit)
        await self.db.commit()
        await self.db.refresh(bond)

        return BondResponse.model_validate(bond)

    async def delete(
        self, bond_id: int, data: BondDeleteSchema, user: User, request: Request
    ) -> None:
        bond = await self.repo.get_or_404(bond_id)
        bond.is_deleted = True
        bond.updated_at = datetime.utcnow()

        audit = AuditLog(
            table_name="bonds",
            record_id=bond_id,
            action="DELETE",
            reason=data.reason,
            old_data={"bond_no": bond.bond_no, "pool_id": bond.pool_id},
            performed_by=user.id,
            ip_address=request.client.host if request.client else "unknown",
        )
        self.db.add(audit)
        await self.db.commit()

    async def get_summary(self, pool_id: int) -> BondSummary:
        base = and_(Bond.pool_id == pool_id, Bond.is_deleted == False)

        # Totals
        totals = await self.db.execute(
            select(
                func.count(Bond.id),
                func.coalesce(func.sum(Bond.opb), 0),
                func.coalesce(func.sum(Bond.total_balance), 0),
            ).where(base)
        )
        total_count, total_opb, total_balance = totals.one()

        async def _group_by(column):
            result = await self.db.execute(
                select(
                    column,
                    func.count(Bond.id),
                    func.coalesce(func.sum(Bond.opb), 0),
                    func.coalesce(func.sum(Bond.total_balance), 0),
                )
                .where(base)
                .group_by(column)
                .order_by(func.count(Bond.id).desc())
            )
            return [
                BondSummaryCategory(
                    label=row[0] or "미분류",
                    bond_count=row[1],
                    total_opb=row[2],
                    total_balance=row[3],
                )
                for row in result.all()
            ]

        # Overdue range buckets
        overdue_label = case(
            (Bond.overdue_months <= 3, "3개월 이하"),
            (Bond.overdue_months <= 6, "3~6개월"),
            (Bond.overdue_months <= 12, "6~12개월"),
            (Bond.overdue_months <= 24, "12~24개월"),
            else_="24개월 초과",
        )
        overdue_result = await self.db.execute(
            select(
                overdue_label.label("range_label"),
                func.count(Bond.id),
                func.coalesce(func.sum(Bond.opb), 0),
                func.coalesce(func.sum(Bond.total_balance), 0),
            )
            .where(base)
            .group_by(overdue_label)
        )
        by_overdue = [
            BondSummaryCategory(
                label=row[0], bond_count=row[1], total_opb=row[2], total_balance=row[3]
            )
            for row in overdue_result.all()
        ]

        return BondSummary(
            pool_id=pool_id,
            total_bond_count=total_count,
            total_opb=total_opb,
            total_balance=total_balance,
            by_debtor_type=await _group_by(Bond.debtor_type),
            by_product_type=await _group_by(Bond.product_type),
            by_collateral_type=await _group_by(Bond.collateral_type),
            by_legal_status=await _group_by(Bond.legal_status),
            by_overdue_range=by_overdue,
        )
