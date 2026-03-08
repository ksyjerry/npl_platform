from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.redis_client import redis_client
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.company import Company
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import RegisterRequest


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def register(self, data: RegisterRequest) -> User:
        if data.password != data.password_confirm:
            raise HTTPException(422, "비밀번호가 일치하지 않습니다.")

        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            raise HTTPException(409, "이미 존재하는 이메일입니다.")

        # Find or create company
        result = await self.db.execute(
            select(Company).where(Company.name == data.company_name)
        )
        company = result.scalar_one_or_none()
        if not company:
            company = Company(name=data.company_name, type=data.member_type)
            self.db.add(company)
            await self.db.flush()

        user = User(
            email=data.email,
            hashed_password=hash_password(data.password),
            name=data.name,
            company_id=company.id,
            department=data.department,
            title=data.title,
            phone_office=data.phone_office,
            phone_mobile=data.phone_mobile,
            role=data.member_type,
            is_verified=True,
            interests=data.interests,
        )
        user = await self.user_repo.create(user)
        await self.db.commit()
        return user

    async def login(self, email: str, password: str, ip: str) -> dict:
        user = await self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(401, "이메일 또는 비밀번호가 일치하지 않습니다.")

        # Update login info
        user.last_login_at = datetime.utcnow()
        user.last_login_ip = ip
        await self.db.commit()

        access_token = create_access_token(str(user.id), user.role, user.name)
        refresh_token = create_refresh_token(str(user.id))

        # Store refresh token in Redis
        expire_seconds = settings.JWT_REFRESH_EXPIRE_DAYS * 86400
        await redis_client.setex(
            f"refresh:{user.id}", expire_seconds, refresh_token
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user,
        }

    async def refresh(self, refresh_token: str) -> str:
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise HTTPException(401, "유효하지 않은 리프레시 토큰입니다.")
            user_id = payload["sub"]
        except Exception:
            raise HTTPException(401, "유효하지 않은 리프레시 토큰입니다.")

        stored = await redis_client.get(f"refresh:{user_id}")
        if stored != refresh_token:
            raise HTTPException(401, "만료되거나 유효하지 않은 리프레시 토큰입니다.")

        user = await self.user_repo.get_by_id(int(user_id))
        if not user:
            raise HTTPException(401, "사용자를 찾을 수 없습니다.")

        return create_access_token(str(user.id), user.role, user.name)

    async def logout(self, user_id: int) -> None:
        await redis_client.delete(f"refresh:{user_id}")
