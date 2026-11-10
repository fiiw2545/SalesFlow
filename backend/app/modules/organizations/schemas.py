
from pydantic import BaseModel, Field, ConfigDict


class OrganizationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=100)
    slug: str = Field(min_length=2, max_length=100, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class OrganizationUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=2, max_length=100)
    slug: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    )


class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    plan: str
    is_active: bool
    created_at: object
    updated_at: object | None = None


class OrganizationListItem(OrganizationResponse):
    role: str


class OrganizationListResponse(BaseModel):
    items: list[OrganizationListItem]
    total: int
    page: int
    limit: int
    total_pages: int


class OrganizationCreateResponse(BaseModel):
    organization: OrganizationResponse
    membership_role: str


class OrganizationDeleteResponse(BaseModel):
    message: str
