
from pydantic import BaseModel, Field, ConfigDict
from typing import Literal


MembershipRole = Literal["ADMIN", "MANAGER", "SALES"]


class MembershipCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user_id: str = Field(min_length=1)
    role: MembershipRole = "SALES"


class MembershipUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: MembershipRole


class MembershipResponse(BaseModel):
    id: str
    user_id: str
    organization_id: str
    role: MembershipRole
    joined_at: object


class MembershipListResponse(BaseModel):
    items: list[MembershipResponse]


class MembershipDeleteResponse(BaseModel):
    message: str

class MembershipListResponse(BaseModel):
    items: list[MembershipResponse]
    total: int
    page: int
    limit: int
    total_pages: int