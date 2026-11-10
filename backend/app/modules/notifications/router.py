from fastapi import APIRouter, Depends, HTTPException, Query, status
from surrealdb import AsyncSurreal

from app.database.dependencies import get_db

from app.security.dependencies import (
    get_current_user,
    get_current_organization_id,
    get_current_membership,
)

from app.modules.notifications.schemas import (
    NotificationResponse,
    NotificationListResponse,
    UnreadCountResponse,
    ReadAllResponse,
)

from app.modules.notifications.service import (
    list_notifications,
    get_unread_count,
    read_notification,
    read_all_notifications,
)


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


@router.get(
    "/",
    response_model=NotificationListResponse,
)
async def get_all_notifications(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    return await list_notifications(
        db=db,
        user_id=str(current_user["id"]),
        organization_id=organization_id,
        page=page,
        limit=limit,
    )


@router.get(
    "/unread-count",
    response_model=UnreadCountResponse,
)
async def get_notifications_unread_count(
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    return await get_unread_count(
        db=db,
        user_id=str(current_user["id"]),
        organization_id=organization_id,
    )


@router.patch(
    "/read-all",
    response_model=ReadAllResponse,
)
async def mark_all_as_read(
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    return await read_all_notifications(
        db=db,
        user_id=str(current_user["id"]),
        organization_id=organization_id,
    )


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
async def mark_as_read(
    notification_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await read_notification(
        db=db,
        notification_id=notification_id,
        user_id=str(current_user["id"]),
        organization_id=organization_id,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    return result