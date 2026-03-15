import secrets
import string
from datetime import datetime, timezone

from fastapi import HTTPException, Request
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.security import hash_password
from app.models.company import Company
from app.models.consulting import Consulting
from app.models.pool_participant import PoolParticipant
from app.models.user import User
from app.repositories.audit_log import AuditLogRepository
from app.schemas.admin import (
    CompanyAdminResponse,
    CompanyCreateSchema,
    CompanyListResponse,
    CompanyUpdateSchema,
    ConsultingAdminListResponse,
    ConsultingAdminResponse,
    ConsultingReplySchema,
    PasswordResetResponse,
    UserAdminResponse,
    UserListResponse,
    UserUpdateSchema,
)


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_repo = AuditLogRepository(db)

    async def get_users(
        self,
        role: str | None = None,
        page: int = 1,
        size: int = 20,
    ) -> UserListResponse:
        query = select(User).options(joinedload(User.company))
        count_query = select(func.count(User.id))

        if role:
            query = query.where(User.role == role)
            count_query = count_query.where(User.role == role)

        query = query.order_by(User.created_at.desc())
        query = query.offset((page - 1) * size).limit(size)

        result = await self.db.execute(query)
        users = list(result.scalars().unique().all())

        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        items = [
            UserAdminResponse(
                id=u.id,
                email=u.email,
                name=u.name,
                role=u.role,
                is_verified=u.is_verified,
                company_id=u.company_id,
                company_name=u.company.name if u.company else "",
                department=u.department,
                title=u.title,
                phone_office=u.phone_office,
                phone_mobile=u.phone_mobile,
                last_login_ip=u.last_login_ip,
                created_at=u.created_at,
            )
            for u in users
        ]

        return UserListResponse(items=items, total=total, page=page, size=size)

    async def update_user(
        self,
        user_id: int,
        data: UserUpdateSchema,
        admin: User,
        request: Request,
    ) -> UserAdminResponse:
        result = await self.db.execute(
            select(User).options(joinedload(User.company)).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(404, "사용자를 찾을 수 없습니다.")

        old_data = {}
        new_data = {}

        if data.role is not None:
            old_data["role"] = user.role
            new_data["role"] = data.role
            user.role = data.role

        if data.is_verified is not None:
            old_data["is_verified"] = user.is_verified
            new_data["is_verified"] = data.is_verified
            user.is_verified = data.is_verified

        if data.company_id is not None:
            old_data["company_id"] = user.company_id
            new_data["company_id"] = data.company_id
            user.company_id = data.company_id

        await self.audit_repo.create(
            table_name="users",
            record_id=user.id,
            action="UPDATE",
            performed_by=admin.id,
            ip_address=request.client.host if request.client else "unknown",
            reason=data.reason,
            old_data=old_data,
            new_data=new_data,
        )

        await self.db.commit()
        await self.db.refresh(user)

        return UserAdminResponse(
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

    async def reset_password(
        self,
        user_id: int,
        admin: User,
        request: Request,
    ) -> PasswordResetResponse:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(404, "사용자를 찾을 수 없습니다.")

        temp = "".join(
            secrets.choice(string.ascii_letters + string.digits) for _ in range(12)
        )
        user.hashed_password = hash_password(temp)

        await self.audit_repo.create(
            table_name="users",
            record_id=user.id,
            action="UPDATE",
            performed_by=admin.id,
            ip_address=request.client.host if request.client else "unknown",
            reason="비밀번호 초기화",
            old_data=None,
            new_data={"password_reset": True},
        )

        await self.db.commit()

        return PasswordResetResponse(
            temp_password=temp,
            message="임시 비밀번호가 발급되었습니다.",
        )

    async def get_consultings(
        self,
        type_filter: str | None = None,
        status_filter: str | None = None,
        page: int = 1,
        size: int = 20,
    ) -> ConsultingAdminListResponse:
        query = select(Consulting, User.name.label("user_name"), Company.name.label("company_name")).join(
            User, Consulting.user_id == User.id
        ).outerjoin(
            Company, User.company_id == Company.id
        )
        count_query = select(func.count(Consulting.id))

        if type_filter:
            query = query.where(Consulting.type == type_filter)
            count_query = count_query.where(Consulting.type == type_filter)

        if status_filter:
            query = query.where(Consulting.status == status_filter)
            count_query = count_query.where(Consulting.status == status_filter)

        query = query.order_by(Consulting.created_at.desc())
        query = query.offset((page - 1) * size).limit(size)

        result = await self.db.execute(query)
        rows = result.all()

        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        items = [
            ConsultingAdminResponse(
                id=row.Consulting.id,
                type=row.Consulting.type,
                name=row.Consulting.name,
                position=row.Consulting.position,
                email=row.Consulting.email,
                title=row.Consulting.title,
                content=row.Consulting.content,
                status=row.Consulting.status,
                reply=row.Consulting.reply,
                replied_at=row.Consulting.replied_at,
                user_name=row.user_name,
                company_name=row.company_name,
                created_at=row.Consulting.created_at,
            )
            for row in rows
        ]

        return ConsultingAdminListResponse(
            items=items, total=total, page=page, size=size
        )

    async def reply_consulting(
        self,
        consulting_id: int,
        data: ConsultingReplySchema,
        admin: User,
        request: Request,
    ) -> ConsultingAdminResponse:
        result = await self.db.execute(
            select(Consulting).where(Consulting.id == consulting_id)
        )
        consulting = result.scalar_one_or_none()
        if not consulting:
            raise HTTPException(404, "상담을 찾을 수 없습니다.")

        old_data = {
            "status": consulting.status,
            "reply": consulting.reply,
            "replied_at": consulting.replied_at.isoformat() if consulting.replied_at else None,
            "replied_by": consulting.replied_by,
        }

        consulting.reply = data.reply
        consulting.replied_by = admin.id
        consulting.replied_at = datetime.now(timezone.utc)
        consulting.status = "replied"

        new_data = {
            "status": consulting.status,
            "reply": consulting.reply,
            "replied_at": consulting.replied_at.isoformat(),
            "replied_by": consulting.replied_by,
        }

        await self.audit_repo.create(
            table_name="consultings",
            record_id=consulting.id,
            action="UPDATE",
            performed_by=admin.id,
            ip_address=request.client.host if request.client else "unknown",
            reason="상담 답변",
            old_data=old_data,
            new_data=new_data,
        )

        await self.db.commit()

        # Re-query with user/company info
        detail_result = await self.db.execute(
            select(
                Consulting,
                User.name.label("user_name"),
                Company.name.label("company_name"),
            )
            .join(User, Consulting.user_id == User.id)
            .outerjoin(Company, User.company_id == Company.id)
            .where(Consulting.id == consulting_id)
        )
        row = detail_result.one()

        return ConsultingAdminResponse(
            id=row.Consulting.id,
            type=row.Consulting.type,
            name=row.Consulting.name,
            position=row.Consulting.position,
            email=row.Consulting.email,
            title=row.Consulting.title,
            content=row.Consulting.content,
            status=row.Consulting.status,
            reply=row.Consulting.reply,
            replied_at=row.Consulting.replied_at,
            user_name=row.user_name,
            company_name=row.company_name,
            created_at=row.Consulting.created_at,
        )

    async def edit_consulting_reply(
        self,
        consulting_id: int,
        data: ConsultingReplySchema,
        admin: User,
        request: Request,
    ) -> ConsultingAdminResponse:
        result = await self.db.execute(
            select(Consulting).where(Consulting.id == consulting_id)
        )
        consulting = result.scalar_one_or_none()
        if not consulting:
            raise HTTPException(404, "상담을 찾을 수 없습니다.")

        if consulting.status != "replied":
            raise HTTPException(400, "답변이 등록되지 않은 상담은 수정할 수 없습니다.")

        old_data = {
            "reply": consulting.reply,
            "replied_at": consulting.replied_at.isoformat() if consulting.replied_at else None,
            "replied_by": consulting.replied_by,
        }

        consulting.reply = data.reply
        consulting.replied_by = admin.id
        consulting.replied_at = datetime.now(timezone.utc)

        new_data = {
            "reply": consulting.reply,
            "replied_at": consulting.replied_at.isoformat(),
            "replied_by": consulting.replied_by,
        }

        await self.audit_repo.create(
            table_name="consultings",
            record_id=consulting.id,
            action="UPDATE",
            performed_by=admin.id,
            ip_address=request.client.host if request.client else "unknown",
            reason="상담 답변 수정",
            old_data=old_data,
            new_data=new_data,
        )

        await self.db.commit()

        detail_result = await self.db.execute(
            select(
                Consulting,
                User.name.label("user_name"),
                Company.name.label("company_name"),
            )
            .join(User, Consulting.user_id == User.id)
            .outerjoin(Company, User.company_id == Company.id)
            .where(Consulting.id == consulting_id)
        )
        row = detail_result.one()

        return ConsultingAdminResponse(
            id=row.Consulting.id,
            type=row.Consulting.type,
            name=row.Consulting.name,
            position=row.Consulting.position,
            email=row.Consulting.email,
            title=row.Consulting.title,
            content=row.Consulting.content,
            status=row.Consulting.status,
            reply=row.Consulting.reply,
            replied_at=row.Consulting.replied_at,
            user_name=row.user_name,
            company_name=row.company_name,
            created_at=row.Consulting.created_at,
        )

    # ── Company CRUD ──

    async def get_companies(
        self,
        type_filter: str | None = None,
        page: int = 1,
        size: int = 50,
    ) -> CompanyListResponse:
        query = select(Company)
        count_query = select(func.count(Company.id))

        if type_filter:
            query = query.where(Company.type == type_filter)
            count_query = count_query.where(Company.type == type_filter)

        query = query.order_by(Company.name.asc())
        query = query.offset((page - 1) * size).limit(size)

        result = await self.db.execute(query)
        companies = list(result.scalars().all())

        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        items = []
        for c in companies:
            uc = await self.db.execute(
                select(func.count(User.id)).where(User.company_id == c.id)
            )
            items.append(
                CompanyAdminResponse(
                    id=c.id,
                    name=c.name,
                    type=c.type,
                    user_count=uc.scalar() or 0,
                    created_at=c.created_at,
                )
            )

        return CompanyListResponse(items=items, total=total, page=page, size=size)

    async def create_company(
        self, data: CompanyCreateSchema, admin: User, request: Request
    ) -> CompanyAdminResponse:
        company = Company(name=data.name, type=data.type)
        self.db.add(company)
        await self.db.flush()

        await self.audit_repo.create(
            table_name="companies",
            record_id=company.id,
            action="CREATE",
            performed_by=admin.id,
            ip_address=request.client.host if request.client else "unknown",
            reason="회사 등록",
            old_data=None,
            new_data={"name": company.name, "type": company.type},
        )

        await self.db.commit()

        return CompanyAdminResponse(
            id=company.id,
            name=company.name,
            type=company.type,
            user_count=0,
            created_at=company.created_at,
        )

    async def update_company(
        self,
        company_id: int,
        data: CompanyUpdateSchema,
        admin: User,
        request: Request,
    ) -> CompanyAdminResponse:
        result = await self.db.execute(
            select(Company).where(Company.id == company_id)
        )
        company = result.scalar_one_or_none()
        if not company:
            raise HTTPException(404, "회사를 찾을 수 없습니다.")

        old_data = {}
        new_data = {}

        if data.name is not None:
            old_data["name"] = company.name
            new_data["name"] = data.name
            company.name = data.name

        if data.type is not None:
            old_data["type"] = company.type
            new_data["type"] = data.type
            company.type = data.type

        await self.audit_repo.create(
            table_name="companies",
            record_id=company.id,
            action="UPDATE",
            performed_by=admin.id,
            ip_address=request.client.host if request.client else "unknown",
            reason=data.reason,
            old_data=old_data,
            new_data=new_data,
        )

        await self.db.commit()
        await self.db.refresh(company)

        uc = await self.db.execute(
            select(func.count(User.id)).where(User.company_id == company.id)
        )

        return CompanyAdminResponse(
            id=company.id,
            name=company.name,
            type=company.type,
            user_count=uc.scalar() or 0,
            created_at=company.created_at,
        )

    async def delete_company(
        self, company_id: int, admin: User, request: Request
    ) -> None:
        result = await self.db.execute(
            select(Company).where(Company.id == company_id)
        )
        company = result.scalar_one_or_none()
        if not company:
            raise HTTPException(404, "회사를 찾을 수 없습니다.")

        uc = await self.db.execute(
            select(func.count(User.id)).where(User.company_id == company.id)
        )
        if (uc.scalar() or 0) > 0:
            raise HTTPException(400, "소속 회원이 있는 회사는 삭제할 수 없습니다.")

        await self.audit_repo.create(
            table_name="companies",
            record_id=company.id,
            action="DELETE",
            performed_by=admin.id,
            ip_address=request.client.host if request.client else "unknown",
            reason="회사 삭제",
            old_data={"name": company.name, "type": company.type},
            new_data=None,
        )

        await self.db.delete(company)
        await self.db.commit()

    # ── Pool Participants ──

    async def get_pool_participants(self, pool_id: int) -> list[dict]:
        result = await self.db.execute(
            select(PoolParticipant, Company.name.label("company_name"))
            .outerjoin(Company, PoolParticipant.company_id == Company.id)
            .where(PoolParticipant.pool_id == pool_id)
        )
        rows = result.fetchall()
        return [
            {
                "pool_id": pp.pool_id,
                "company_id": pp.company_id,
                "company_name": cname or "",
            }
            for pp, cname in rows
        ]

    async def add_pool_participant(
        self, pool_id: int, company_id: int, admin: User, request: Request
    ) -> dict:
        # Check if already exists
        existing = await self.db.execute(
            select(PoolParticipant).where(
                and_(
                    PoolParticipant.pool_id == pool_id,
                    PoolParticipant.company_id == company_id,
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(409, "이미 참여 등록된 업체입니다.")

        pp = PoolParticipant(pool_id=pool_id, company_id=company_id)
        self.db.add(pp)

        await self.audit_repo.create(
            table_name="pool_participants",
            record_id=pool_id,
            action="CREATE",
            performed_by=admin.id,
            ip_address=request.client.host if request.client else "unknown",
            reason="Pool 참여자 추가",
            old_data=None,
            new_data={"pool_id": pool_id, "company_id": company_id},
        )

        await self.db.commit()

        # Get company name
        c_result = await self.db.execute(
            select(Company.name).where(Company.id == company_id)
        )
        cname = c_result.scalar_one_or_none() or ""

        return {"pool_id": pool_id, "company_id": company_id, "company_name": cname}

    async def remove_pool_participant(
        self, pool_id: int, company_id: int, admin: User, request: Request
    ) -> None:
        result = await self.db.execute(
            select(PoolParticipant).where(
                and_(
                    PoolParticipant.pool_id == pool_id,
                    PoolParticipant.company_id == company_id,
                )
            )
        )
        pp = result.scalar_one_or_none()
        if not pp:
            raise HTTPException(404, "참여 등록된 업체가 아닙니다.")

        await self.audit_repo.create(
            table_name="pool_participants",
            record_id=pool_id,
            action="DELETE",
            performed_by=admin.id,
            ip_address=request.client.host if request.client else "unknown",
            reason="Pool 참여자 제거",
            old_data={"pool_id": pool_id, "company_id": company_id},
            new_data=None,
        )

        await self.db.delete(pp)
        await self.db.commit()
