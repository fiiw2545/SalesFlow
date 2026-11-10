from datetime import datetime

from pydantic import BaseModel
from surrealdb import RecordID


class NotificationResponse(BaseModel):
    id: RecordID
    user_id: RecordID
    organization_id: RecordID

    type: str
    title: str
    message: str

    entity_type: str | None = None
    entity_id: RecordID | None = None

    is_read: bool
    created_at: datetime


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class UnreadCountResponse(BaseModel):
    unread_count: int


class ReadAllResponse(BaseModel):
    message: str
    updated_count: int