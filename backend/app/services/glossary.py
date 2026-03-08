from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.glossary import GlossaryRepository
from app.schemas.glossary import GlossaryItem, GlossaryListResponse


class GlossaryService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = GlossaryRepository(db)

    async def get_glossary(self) -> GlossaryListResponse:
        items = await self.repo.get_all()
        return GlossaryListResponse(
            items=[GlossaryItem.model_validate(item) for item in items]
        )
