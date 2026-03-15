import re
from collections import defaultdict
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
    BondDetailResponse,
    BondListResponse,
    BondMatrixCell,
    BondMatrixRow,
    BondMatrixSection,
    BondResponse,
    BondSummary,
    BondSummaryCategory,
    BondUpdate,
)

BOND_TYPE_LABELS = {
    "A": "일반무담보채권",
    "B1": "채무조정채권(CCRS)",
    "B2": "채무조정채권(IRL)",
    "C": "담보채권",
}

DEBTOR_TYPES = ["개인", "개인사업자", "법인"]


class BondService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = BondRepository(db)

    @staticmethod
    def _normalize_extra_data(extra: dict | None) -> dict | None:
        if not extra:
            return extra
        return {re.sub(r'\s+', ' ', k).strip(): v for k, v in extra.items()}

    async def get_detail(self, bond_id: int) -> BondDetailResponse:
        bond = await self.repo.get_or_404(bond_id)
        result = BondDetailResponse.model_validate(bond)
        result.extra_data = self._normalize_extra_data(result.extra_data)
        return result

    async def get_list(
        self,
        pool_id: int,
        bond_type: str | None = None,
        page: int = 1,
        size: int = 20,
        include_extra: bool = False,
    ) -> BondListResponse:
        items, total = await self.repo.get_list(pool_id=pool_id, bond_type=bond_type, page=page, size=size)
        if include_extra:
            bond_items = []
            for b in items:
                detail = BondDetailResponse.model_validate(b)
                detail.extra_data = self._normalize_extra_data(detail.extra_data)
                bond_items.append(detail)
        else:
            bond_items = [BondResponse.model_validate(b) for b in items]
        return BondListResponse(
            items=bond_items,
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
                func.count(func.distinct(Bond.debtor_id_masked)),
                func.coalesce(func.sum(Bond.opb), 0),
                func.coalesce(func.sum(Bond.total_balance), 0),
            ).where(base)
        )
        total_count, total_debtor_count, total_opb, total_balance = totals.one()

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

        # Matrix: bond_type × creditor × debtor_type
        matrix = await self._build_matrix(pool_id)

        return BondSummary(
            pool_id=pool_id,
            total_bond_count=total_count,
            total_debtor_count=total_debtor_count,
            total_opb=total_opb,
            total_balance=total_balance,
            by_debtor_type=await _group_by(Bond.debtor_type),
            by_product_type=await _group_by(Bond.product_type),
            by_collateral_type=await _group_by(Bond.collateral_type),
            by_legal_status=await _group_by(Bond.legal_status),
            by_overdue_range=by_overdue,
            matrix=matrix,
        )

    async def _build_matrix(self, pool_id: int) -> list[BondMatrixSection]:
        """Build matrix: bond_type × creditor × debtor_type with counts & OPB."""
        base = and_(Bond.pool_id == pool_id, Bond.is_deleted == False)

        result = await self.db.execute(
            select(
                Bond.bond_type,
                Bond.creditor,
                Bond.debtor_type,
                func.count(func.distinct(Bond.debtor_id_masked)).label("debtor_count"),
                func.count(Bond.id).label("bond_count"),
                func.coalesce(func.sum(Bond.opb), 0).label("opb"),
            )
            .where(base)
            .group_by(Bond.bond_type, Bond.creditor, Bond.debtor_type)
            .order_by(Bond.bond_type, Bond.creditor, Bond.debtor_type)
        )
        rows = result.all()

        # Organize data: bond_type → creditor → debtor_type → cell
        data: dict[str, dict[str, dict[str, BondMatrixCell]]] = defaultdict(
            lambda: defaultdict(lambda: defaultdict(BondMatrixCell))
        )
        for row in rows:
            bt = row.bond_type or "A"
            cred = row.creditor or "미분류"
            dt = row.debtor_type or "미분류"
            data[bt][cred][dt] = BondMatrixCell(
                debtor_count=row.debtor_count,
                bond_count=row.bond_count,
                opb=row.opb,
            )

        sections = []
        for bt in ["A", "B1", "B2", "C"]:
            if bt not in data:
                continue

            creditor_rows: list[BondMatrixRow] = []
            section_total = BondMatrixCell()

            for cred in sorted(data[bt].keys()):
                by_dt = {}
                row_total = BondMatrixCell()

                for dt in DEBTOR_TYPES + [k for k in data[bt][cred] if k not in DEBTOR_TYPES]:
                    if dt in data[bt][cred]:
                        cell = data[bt][cred][dt]
                        by_dt[dt] = cell
                        row_total.debtor_count += cell.debtor_count
                        row_total.bond_count += cell.bond_count
                        row_total.opb += cell.opb

                creditor_rows.append(BondMatrixRow(
                    creditor=cred,
                    by_debtor_type=by_dt,
                    total=row_total,
                ))

                section_total.debtor_count += row_total.debtor_count
                section_total.bond_count += row_total.bond_count
                section_total.opb += row_total.opb

            # Build section total by_debtor_type
            total_by_dt: dict[str, BondMatrixCell] = {}
            all_dts = set()
            for row in creditor_rows:
                all_dts.update(row.by_debtor_type.keys())
            for dt in all_dts:
                total_cell = BondMatrixCell()
                for row in creditor_rows:
                    if dt in row.by_debtor_type:
                        c = row.by_debtor_type[dt]
                        total_cell.debtor_count += c.debtor_count
                        total_cell.bond_count += c.bond_count
                        total_cell.opb += c.opb
                total_by_dt[dt] = total_cell

            sections.append(BondMatrixSection(
                bond_type=bt,
                bond_type_label=BOND_TYPE_LABELS.get(bt, bt),
                rows=creditor_rows,
                total=BondMatrixRow(
                    creditor="합계",
                    by_debtor_type=total_by_dt,
                    total=section_total,
                ),
            ))

        return sections
