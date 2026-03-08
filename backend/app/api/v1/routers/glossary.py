from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.glossary import GlossaryListResponse
from app.services.glossary import GlossaryService

router = APIRouter(prefix="/glossary", tags=["glossary"])


@router.get("", response_model=GlossaryListResponse)
async def list_glossary(
    db: AsyncSession = Depends(get_db),
):
    return await GlossaryService(db).get_glossary()
