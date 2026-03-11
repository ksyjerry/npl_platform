"""Seed script: creates test users (admin, accountant, seller, buyer) for development."""
import asyncio
from sqlalchemy import select
from app.core.database import async_session
from app.core.security import hash_password
from app.models.company import Company
from app.models.user import User


SEED_USERS = [
    {"email": "admin@test.com", "name": "관리자", "role": "admin", "company_name": "삼일PwC", "company_type": "accountant"},
    {"email": "acc@test.com", "name": "회계담당", "role": "accountant", "company_name": "삼일PwC", "company_type": "accountant"},
    {"email": "seller@test.com", "name": "매도인", "role": "seller", "company_name": "테스트은행", "company_type": "seller"},
    {"email": "buyer@test.com", "name": "매수인", "role": "buyer", "company_name": "테스트투자", "company_type": "buyer"},
]

PASSWORD = "test1234"


async def seed():
    async with async_session() as db:
        for u in SEED_USERS:
            existing = await db.execute(select(User).where(User.email == u["email"]))
            if existing.scalar_one_or_none():
                print(f"  SKIP  {u['email']} (already exists)")
                continue

            # Find or create company
            result = await db.execute(
                select(Company).where(Company.name == u["company_name"])
            )
            company = result.scalar_one_or_none()
            if not company:
                company = Company(name=u["company_name"], type=u["company_type"])
                db.add(company)
                await db.flush()
                print(f"  + Company: {u['company_name']}")

            user = User(
                email=u["email"],
                hashed_password=hash_password(PASSWORD),
                name=u["name"],
                role=u["role"],
                is_verified=True,
                company_id=company.id,
            )
            db.add(user)
            print(f"  + User: {u['email']} (role={u['role']})")

        await db.commit()
    print("\nDone!")


if __name__ == "__main__":
    asyncio.run(seed())
