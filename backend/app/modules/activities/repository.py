from surrealdb import AsyncSurreal, RecordID

def to_record_id(table: str, record_id: str) -> RecordID:
    if ":" in record_id:
        record_id = record_id.split(":", 1)[1]

    return RecordID(table, record_id)


async def get_activities(
    db: AsyncSurreal,
    organization_id: str,
):
    organization_id = to_record_id(
        "organizations",
        organization_id,
    )

    query = """
        SELECT *
        FROM activities
        WHERE organization_id = $organization_id
        ORDER BY created_at DESC;
    """

    return await db.query(
        query,
        {"organization_id": organization_id},
    )


async def get_activity_by_id(
    db: AsyncSurreal,
    activity_id: str,
    organization_id: str,
):
    activity_id = to_record_id("activities", activity_id)
    organization_id = to_record_id(
        "organizations",
        organization_id,
    )

    query = """
        SELECT *
        FROM $activity_id
        WHERE organization_id = $organization_id;
    """

    return await db.query(
        query,
        {
            "activity_id": activity_id,
            "organization_id": organization_id,
        },
    )


async def create_activity(
    db: AsyncSurreal,
    data: dict,
):
    data = data.copy()

    data["organization_id"] = to_record_id(
        "organizations",
        data["organization_id"],
    )

    data["performed_by"] = to_record_id(
        "users",
        data["performed_by"],
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
        CREATE activities CONTENT $data
        RETURN AFTER;
    """

    return await db.query(
        query,
        {"data": data},
    )


async def update_activity(
    db: AsyncSurreal,
    activity_id: str,
    organization_id: str,
    data: dict,
):
    activity_id = to_record_id("activities", activity_id)
    organization_id = to_record_id(
        "organizations",
        organization_id,
    )

    data = data.copy()

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
        UPDATE $activity_id
        MERGE $data
        WHERE organization_id = $organization_id
        RETURN AFTER;
    """

    return await db.query(
        query,
        {
            "activity_id": activity_id,
            "organization_id": organization_id,
            "data": data,
        },
    )


async def delete_activity(
    db: AsyncSurreal,
    activity_id: str,
    organization_id: str,
):
    activity_id = to_record_id("activities", activity_id)
    organization_id = to_record_id(
        "organizations",
        organization_id,
    )

    query = """
        DELETE $activity_id
        WHERE organization_id = $organization_id
        RETURN BEFORE;
    """

    return await db.query(
        query,
        {
            "activity_id": activity_id,
            "organization_id": organization_id,
        },
    )


async def get_deal_by_id(
    db: AsyncSurreal,
    deal_id: str,
    organization_id: str,
):
    deal_id = to_record_id("deals", deal_id)
    organization_id = to_record_id(
        "organizations",
        organization_id,
    )

    query = """
        SELECT *
        FROM $deal_id
        WHERE organization_id = $organization_id;
    """

    return await db.query(
        query,
        {
            "deal_id": deal_id,
            "organization_id": organization_id,
        },
    )


async def get_contact_by_id(
    db: AsyncSurreal,
    contact_id: str,
    organization_id: str,
):
    contact_id = to_record_id("contacts", contact_id)
    organization_id = to_record_id(
        "organizations",
        organization_id,
    )

    query = """
        SELECT *
        FROM $contact_id
        WHERE organization_id = $organization_id;
    """

    return await db.query(
        query,
        {
            "contact_id": contact_id,
            "organization_id": organization_id,
        },
    )