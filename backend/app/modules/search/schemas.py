from typing import Literal

from pydantic import BaseModel, ConfigDict


class SearchItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: Literal["company", "contact", "deal"]
    id: str
    title: str
    subtitle: str | None = None
    href: str


class SearchResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    query: str
    companies: list[SearchItem]
    contacts: list[SearchItem]
    deals: list[SearchItem]
    total: int