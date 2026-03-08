from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditLogRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        table_name: str,
        record_id: int,
        action: str,
        performed_by: int,
        ip_address: str,
        reason: str | None = None,
        old_data: dict | None = None,
        new_data: dict | None = None,
    ) -> None:
        log = AuditLog(
            table_name=table_name,
            record_id=record_id,
            action=action,
            reason=reason,
            old_data=old_data,
            new_data=new_data,
            performed_by=performed_by,
            ip_address=ip_address,
        )
        self.db.add(log)
        await self.db.flush()
