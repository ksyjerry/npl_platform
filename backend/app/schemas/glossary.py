from pydantic import BaseModel, ConfigDict


class GlossaryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    term: str
    definition: str
    sort_order: int


class GlossaryListResponse(BaseModel):
    items: list[GlossaryItem]
