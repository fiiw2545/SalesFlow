
import logging

from surrealdb import AsyncSurreal

from app.integrations.line.service import (
    LineDeliveryError,
    send_text_message,
)

from app.modules.notifications.repository import (
    get_notifications,
    count_notifications,
    count_unread_notifications,
    mark_notification_as_read,
    mark_all_notifications_as_read,
    create_notification,
    get_user_line_id,
)


def extract_rows(result):
    if not isinstance(result, list):
        return []

    rows = []

    for item in result:
        if not isinstance(item, dict):
            continue

        if "id" in item:
            rows.append(item)
            continue

        if "line_user_id" in item:
            rows.append(item)
            continue

        nested = item.get("result")

        if isinstance(nested, list):
            rows.extend(
                row for row in nested
                if isinstance(row, dict)
            )
        elif isinstance(nested, dict):
            rows.append(nested)

    return rows


async def list_notifications(
    db: AsyncSurreal,
    user_id: str,
    organization_id: str,
    page: int = 1,
    limit: int = 10,
):
    items = await get_notifications(
        db=db,
        user_id=user_id,
        organization_id=organization_id,
        page=page,
        limit=limit,
    )

    total = await count_notifications(
        db=db,
        user_id=user_id,
        organization_id=organization_id,
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


async def get_unread_count(
    db: AsyncSurreal,
    user_id: str,
    organization_id: str,
):
    total = await count_unread_notifications(
        db=db,
        user_id=user_id,
        organization_id=organization_id,
    )

    return {
        "unread_count": total,
    }


async def read_notification(
    db: AsyncSurreal,
    notification_id: str,
    user_id: str,
    organization_id: str,
):
    result = await mark_notification_as_read(
        db=db,
        notification_id=notification_id,
        user_id=user_id,
        organization_id=organization_id,
    )

    rows = extract_rows(result)

    if not rows:
        return None

    return rows[0]


async def read_all_notifications(
    db: AsyncSurreal,
    user_id: str,
    organization_id: str,
):
    result = await mark_all_notifications_as_read(
        db=db,
        user_id=user_id,
        organization_id=organization_id,
    )

    rows = extract_rows(result)

    return {
        "message": "All notifications marked as read",
        "updated_count": len(rows),
    }


async def send_notification(
    db: AsyncSurreal,
    user_id: str,
    organization_id: str,
    notification_type: str,
    title: str,
    message: str,
    entity_type: str | None = None,
    entity_id: str | None = None,
):
    try:
        notification = await create_notification(
            db=db,
            user_id=user_id,
            organization_id=organization_id,
            notification_type=notification_type,
            title=title,
            message=message,
            entity_type=entity_type,
            entity_id=entity_id,
        )

    except Exception:
        logging.exception(
            "Failed to create notification for user_id=%s",
            user_id,
        )
        return None

    # LINE delivery is optional.
    # In-app notification must remain successful even if LINE fails.
    try:
        line_user_id = await get_user_line_id(
            db=db,
            user_id=user_id,
        )

        if line_user_id:
            line_message = f"{title}\n\n{message}"

            await send_text_message(
                to=line_user_id,
                text=line_message,
            )

            logging.info(
                "LINE notification sent: user_id=%s type=%s",
                user_id,
                notification_type,
            )

    except Exception:
        logging.exception(
            "Failed to send LINE notification: user_id=%s type=%s",
            user_id,
            notification_type,
        )

    return notification
