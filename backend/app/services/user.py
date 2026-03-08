from fastapi import HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.user import User
from app.repositories.audit_log import AuditLogRepository
from app.schemas.user import UserMeResponse, UserMeUpdate


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_repo = AuditLogRepository(db)

    async def get_me(self, user: User) -> UserMeResponse:
        result = await self.db.execute(
            select(User).options(joinedload(User.company)).where(User.id == user.id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(404, "사용자를 찾을 수 없습니다.")

        return UserMeResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            is_verified=user.is_verified,
            company_name=user.company.name if user.company else "",
            department=user.department,
            title=user.title,
            phone_office=user.phone_office,
            phone_mobile=user.phone_mobile,
            last_login_ip=user.last_login_ip,
            created_at=user.created_at,
        )

    async def update_me(
        self,
        user: User,
        data: UserMeUpdate,
        request: Request,
    ) -> UserMeResponse:
        result = await self.db.execute(
            select(User).options(joinedload(User.company)).where(User.id == user.id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(404, "사용자를 찾을 수 없습니다.")

        old_data = {}
        new_data = {}

        updatable_fields = ["name", "department", "title", "phone_office", "phone_mobile"]
        for field in updatable_fields:
            value = getattr(data, field)
            if value is not None:
                old_data[field] = getattr(user, field)
                new_data[field] = value
                setattr(user, field, value)

        if not new_data:
            raise HTTPException(422, "변경할 항목이 없습니다.")

        await self.audit_repo.create(
            table_name="users",
            record_id=user.id,
            action="UPDATE",
            performed_by=user.id,
            ip_address=request.client.host if request.client else "unknown",
            reason=data.reason,
            old_data=old_data,
            new_data=new_data,
        )

        await self.db.commit()
        await self.db.refresh(user)

        return UserMeResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            is_verified=user.is_verified,
            company_name=user.company.name if user.company else "",
            department=user.department,
            title=user.title,
            phone_office=user.phone_office,
            phone_mobile=user.phone_mobile,
            last_login_ip=user.last_login_ip,
            created_at=user.created_at,
        )
