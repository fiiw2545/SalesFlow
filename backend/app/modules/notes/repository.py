from surrealdb import AsyncSurreal, RecordID


def to_record_id(table: str, record_id: str) -> RecordID:
    if ":" in record_id:
        record_id = record_id.split(":", 1)[1]

    return RecordID(table, record_id)


async def get_notes(
    db: AsyncSurreal,
    organization_id: str,
):
    query = """
        SELECT *
        FROM notes
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


async def get_note_by_id(
    db: AsyncSurreal,
    note_id: str,
    organization_id: str,
):
    query = """
        SELECT *
        FROM $note_id
        WHERE organization_id = $organization_id;
    """

    result = await db.query(
        query,
        {
            "note_id": to_record_id("notes", note_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )

    return result


async def create_note(
    db: AsyncSurreal,
    data: dict,
):
    data["organization_id"] = to_record_id(
        "organizations",
        data["organization_id"],
    )

    data["created_by"] = to_record_id(
        "users",
        data["created_by"],
    )

    if data.get("company_id"):
        data["company_id"] = to_record_id(
            "companies",
            data["company_id"],
        )

    if data.get("contact_id"):
        data["contact_id"] = to_record_id(
            "contacts",
            data["contact_id"],
        )

    if data.get("deal_id"):
        data["deal_id"] = to_record_id(
            "deals",
            data["deal_id"],
        )

    query = """
        CREATE notes CONTENT $data
        RETURN AFTER;
    """

    result = await db.query(
        query,
        {"data": data},
    )

    return result


async def update_note(
    db: AsyncSurreal,
    note_id: str,
    organization_id: str,
    data: dict,
):
    if data.get("company_id"):
        data["company_id"] = to_record_id(
            "companies",
            data["company_id"],
        )

    if data.get("contact_id"):
        data["contact_id"] = to_record_id(
            "contacts",
            data["contact_id"],
        )

    if data.get("deal_id"):
        data["deal_id"] = to_record_id(
            "deals",
            data["deal_id"],
        )

    query = """
        UPDATE $note_id
        MERGE $data
        WHERE organization_id = $organization_id
        RETURN AFTER;
    """

    result = await db.query(
        query,
        {
            "note_id": to_record_id("notes", note_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
            "data": data,
        },
    )

    return result


async def delete_note(
    db: AsyncSurreal,
    note_id: str,
    organization_id: str,
):
    query = """
        DELETE $note_id
        WHERE organization_id = $organization_id
        RETURN BEFORE;
    """

    result = await db.query(
        query,
        {
            "note_id": to_record_id("notes", note_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )

    return result


async def get_company_by_id(
    db: AsyncSurreal,
    company_id: str,
    organization_id: str,
):
    query = """
        SELECT *
        FROM $company_id
        WHERE organization_id = $organization_id;
    """

    result = await db.query(
        query,
        {
            "company_id": to_record_id("companies", company_id),
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