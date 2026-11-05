from surrealdb import AsyncSurreal, RecordID


def to_record_id(table: str, record_id: str) -> RecordID:
    if ":" in record_id:
        record_id = record_id.split(":", 1)[1]

    return RecordID(table, record_id)


async def get_tasks(
    db: AsyncSurreal,
    organization_id: str,
):
    query = """
        SELECT *
        FROM tasks
        WHERE organization_id = $organization_id
        ORDER BY created_at DESC;
    """

    result = await db.query(
        query,
        {
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            )
        },
    )

    return result


async def get_task_by_id(
    db: AsyncSurreal,
    task_id: str,
    organization_id: str,
):
    query = """
        SELECT *
        FROM $task_id
        WHERE organization_id = $organization_id;
    """

    result = await db.query(
        query,
        {
            "task_id": to_record_id("tasks", task_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )

    return result


async def create_task(
    db: AsyncSurreal,
    data: dict,
):
    data["organization_id"] = to_record_id(
        "organizations",
        data["organization_id"],
    )

    data["assigned_to"] = to_record_id(
        "users",
        data["assigned_to"],
    )

    if data.get("deal_id"):
        data["deal_id"] = to_record_id(
            "deals",
            data["deal_id"],
        )

    if data.get("contact_id"):
        data["contact_id"] = to_record_id(
            "contacts",
            data["contact_id"],
        )

    query = """
        CREATE tasks CONTENT $data
        RETURN AFTER;
    """

    result = await db.query(query, {"data": data})

    return result


async def update_task(
    db: AsyncSurreal,
    task_id: str,
    organization_id: str,
    data: dict,
):
    task_record_id = to_record_id("tasks", task_id)

    organization_record_id = to_record_id(
        "organizations",
        organization_id,
    )

    if data.get("deal_id"):
        data["deal_id"] = to_record_id(
            "deals",
            data["deal_id"],
        )

    if data.get("contact_id"):
        data["contact_id"] = to_record_id(
            "contacts",
            data["contact_id"],
        )

    query = """
        UPDATE $task_id
        MERGE $data
        WHERE organization_id = $organization_id
        RETURN AFTER;
    """

    result = await db.query(
        query,
        {
            "task_id": task_record_id,
            "organization_id": organization_record_id,
            "data": data,
        },
    )

    return result


async def delete_task(
    db: AsyncSurreal,
    task_id: str,
    organization_id: str,
):
    query = """
        DELETE $task_id
        WHERE organization_id = $organization_id
        RETURN BEFORE;
    """

    result = await db.query(
        query,
        {
            "task_id": to_record_id("tasks", task_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )

    return result


async def get_deal_by_id(
    db: AsyncSurreal,
    deal_id: str,
    organization_id: str,
):
    query = """
        SELECT *
        FROM $deal_id
        WHERE organization_id = $organization_id;
    """

    result = await db.query(
        query,
        {
            "deal_id": to_record_id("deals", deal_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )

    return result


async def get_contact_by_id(
    db: AsyncSurreal,
    contact_id: str,
    organization_id: str,
):
    query = """
        SELECT *
        FROM $contact_id
        WHERE organization_id = $organization_id;
    """

    result = await db.query(
        query,
        {
            "contact_id": to_record_id("contacts", contact_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )

    return result