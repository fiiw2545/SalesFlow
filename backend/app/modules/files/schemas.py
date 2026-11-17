
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


FileCategory = Literal["IMAGE", "DOCUMENT", "OTHER"]


class FileResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    organization_id: str | None = None
    owner_user_id: str | None = None
    original_name: str
    content_type: str
    extension: str
    size: int
    category: FileCategory
    uploaded_by: str
    created_at: datetime


class FileListResponse(BaseModel):
    items: list[FileResponse]
    total: int
    limit: int
    offset: int


class FileDeleteResponse(BaseModel):
    message: str
    file_id: str
