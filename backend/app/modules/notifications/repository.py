from surrealdb import AsyncSurreal, RecordID


def to_record_id(table: str, record_id: str) -> RecordID:
    if ":" in record_id:
        record_id = record_id.split(":", 1)[1]

    return RecordID(table, record_id)


async def get_notifications(
    db: AsyncSurreal,
    user_id: str,
    organization_id: str,
    page: int = 1,
    limit: int = 10,
):
    offset = (page - 1) * limit

    query = """
        SELECT *
        FROM notifications
        WHERE user_id = $user_id
        AND organization_id = $organization_id
        ORDER BY created_at DESC, id DESC
        START $offset;
    """

    result = await db.query(
        query,
        {
            "user_id": to_record_id("users", user_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
            "offset": offset,
        },
    )

    if not isinstance(result, list):
        return []

    return result[:limit]


async def count_notifications(
    db: AsyncSurreal,
    user_id: str,
    organization_id: str,
):
    query = """
        SELECT count() AS total
        FROM notifications
        WHERE user_id = $user_id
        AND organization_id = $organization_id
        GROUP ALL;
    """

    result = await db.query(
        query,
        {
            "user_id": to_record_id("users", user_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )

    if not isinstance(result, list):
        return 0

    for item in result:
        if not isinstance(item, dict):
            continue

        if "total" in item:
            return item["total"]

        rows = item.get("result")

        if isinstance(rows, list) and rows:
            return rows[0].get("total", 0)

        if isinstance(rows, dict):
            return rows.get("total", 0)

    return 0


async def count_unread_notifications(
    db: AsyncSurreal,
    user_id: str,
    organization_id: str,
):
    query = """
        SELECT count() AS total
        FROM notifications
        WHERE user_id = $user_id
        AND organization_id = $organization_id
        AND is_read = false
        GROUP ALL;
    """

    result = await db.query(
        query,
        {
            "user_id": to_record_id("users", user_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )

    if not isinstance(result, list):
        return 0

    for item in result:
        if not isinstance(item, dict):
            continue

        if "total" in item:
            return item["total"]

        rows = item.get("result")

        if isinstance(rows, list) and rows:
            return rows[0].get("total", 0)

        if isinstance(rows, dict):
            return rows.get("total", 0)

    return 0


async def mark_notification_as_read(
    db: AsyncSurreal,
    notification_id: str,
    user_id: str,
    organization_id: str,
):
    query = """
        UPDATE $notification_id
        SET is_read = true
        WHERE user_id = $user_id
        AND organization_id = $organization_id
        RETURN AFTER;
    """

    result = await db.query(
        query,
        {
            "notification_id": to_record_id(
                "notifications",
                notification_id,
            ),
            "user_id": to_record_id("users", user_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )

    return result


async def mark_all_notifications_as_read(
    db: AsyncSurreal,
    user_id: str,
    organization_id: str,
):
    query = """
        UPDATE notifications
        SET is_read = true
        WHERE user_id = $user_id
        AND organization_id = $organization_id
        AND is_read = false
        RETURN AFTER;
    """

    result = await db.query(
        query,
        {
            "user_id": to_record_id("users", user_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )

    return result

async def create_notification(
    db: AsyncSurreal,
    user_id: str,
    organization_id: str,
    notification_type: str,
    title: str,
    message: str,
    entity_type: str | None = None,
    entity_id: str | None = None,
):
    data = {
        "user_id": to_record_id("users", user_id),
        "organization_id": to_record_id(
            "organizations",
            organization_id,
        ),
        "type": notification_type,
        "title": title,
        "message": message,
        "is_read": False,
    }

    if entity_type and entity_id:
        allowed_tables = {
            "task": "tasks",
            "deal": "deals",
            "activity": "activities",
        }

        table = allowed_tables.get(entity_type)

        if table is None:
            raise ValueError(
                f"Unsupported notification entity type: {entity_type}"
            )

        data["entity_type"] = entity_type
        data["entity_id"] = to_record_id(table, entity_id)

    query = """
        CREATE notifications CONTENT $data
        RETURN AFTER;
    """

    return await db.query(query, {"data": data})