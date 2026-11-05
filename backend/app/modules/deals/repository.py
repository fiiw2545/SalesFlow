from surrealdb import AsyncSurreal, RecordID


def to_record_id(table: str, record_id: str) -> RecordID:
    if ":" in record_id:
        record_id = record_id.split(":", 1)[1]

    return RecordID(table, record_id)


async def get_deals(
    db: AsyncSurreal,
    organization_id: str,
):
    organization_id = to_record_id(
        "organizations",
        organization_id,
    )

    query = """
        SELECT *
        FROM deals
        WHERE organization_id = $organization_id
        ORDER BY created_at DESC;
    """

    return await db.query(
        query,
        {"organization_id": organization_id},
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


async def create_deal(
    db: AsyncSurreal,
    data: dict,
):
    data = data.copy()

    data["organization_id"] = to_record_id(
        "organizations",
        data["organization_id"],
    )
    data["owner_id"] = to_record_id(
        "users",
        data["owner_id"],
    )
    data["stage_id"] = to_record_id(
        "stages",
        data["stage_id"],
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

    query = """
        CREATE deals CONTENT $data
        RETURN AFTER;
    """

    return await db.query(
        query,
        {"data": data},
    )


async def update_deal(
    db: AsyncSurreal,
    deal_id: str,
    organization_id: str,
    data: dict,
):
    deal_id = to_record_id("deals", deal_id)
    organization_id = to_record_id(
        "organizations",
        organization_id,
    )

    data = data.copy()

    data["stage_id"] = to_record_id(
        "stages",
        data["stage_id"],
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

    query = """
        UPDATE $deal_id
        MERGE $data
        WHERE organization_id = $organization_id
        RETURN AFTER;
    """

    return await db.query(
        query,
        {
            "deal_id": deal_id,
            "organization_id": organization_id,
            "data": data,
        },
    )


async def delete_deal(
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
        DELETE $deal_id
        WHERE organization_id = $organization_id
        RETURN BEFORE;
    """

    return await db.query(
        query,
        {
            "deal_id": deal_id,
            "organization_id": organization_id,
        },
    )


async def get_stage_by_id(
    db: AsyncSurreal,
    stage_id: str,
):
    if ":" in stage_id:
        stage_id = stage_id.split(":", 1)[1]

    query = """
        SELECT *
        FROM type::record('stages', $stage_id);
    """

    result = await db.query(
        query,
        {"stage_id": stage_id},
    )

    return result


async def get_company_by_id(
    db: AsyncSurreal,
    company_id: str,
    organization_id: str,
):
    company_record = to_record_id("companies", company_id)

    organization_record = to_record_id(
        "organizations",
        organization_id,
    )

    query = """
        SELECT *
        FROM companies
        WHERE organization_id = $organization_id;
    """

    result = await db.query(
        query,
        {
            "organization_id": organization_record,
        },
    )

    for company in result:
        if str(company.get("id")) == str(company_record):
            return [company]

    return []


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

async def get_deals_by_stage_id(
    db: AsyncSurreal,
    stage_id: str,
    organization_id: str,
):
    stage_id = to_record_id("stages", stage_id)
    organization_id = to_record_id(
        "organizations",
        organization_id,
    )

    query = """
        SELECT id
        FROM deals
        WHERE stage_id = $stage_id
          AND organization_id = $organization_id
        LIMIT 1;
    """

    result = await db.query(
        query,
        {
            "stage_id": stage_id,
            "organization_id": organization_id,
        },
    )

    return result