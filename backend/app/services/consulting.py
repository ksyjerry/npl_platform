from sqlalchemy.ext.asyncio import AsyncSession

from app.models.consulting import Consulting
from app.models.user import User
from app.repositories.consulting import ConsultingRepository
from app.schemas.consulting import (
    ConsultingCreate,
    ConsultingListResponse,
    ConsultingResponse,
)


class ConsultingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ConsultingRepository(db)

    async def submit(self, data: ConsultingCreate, user: User) -> ConsultingResponse:
        consulting = Consulting(
            user_id=user.id,
            type=data.type,
            name=data.name,
            position=data.position,
            email=data.email,
            title=data.title,
            content=data.content,
            status="pending",
        )
        consulting = await self.repo.create(consulting)
        await self.db.commit()
        return ConsultingResponse.model_validate(consulting)

    async def get_list(
        self,
        user: User,
        type_filter: str | None = None,
        page: int = 1,
        size: int = 20,
    ) -> ConsultingListResponse:
        # seller/buyer see only their own; admin/accountant see all
        user_id = user.id if user.role in ("seller", "buyer") else None
        items, total = await self.repo.get_list(
            user_id=user_id, type_filter=type_filter, page=page, size=size
        )
        return ConsultingListResponse(
            items=[ConsultingResponse.model_validate(c) for c in items],
            total=total,
            page=page,
            size=size,
        )
