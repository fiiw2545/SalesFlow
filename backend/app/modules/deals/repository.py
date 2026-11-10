from surrealdb import AsyncSurreal, RecordID


def to_record_id(table: str, record_id: str) -> RecordID:
    if ":" in record_id:
        record_id = record_id.split(":", 1)[1]

    return RecordID(table, record_id)


async def get_deals(
    db: AsyncSurreal,
    organization_id: str,
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
):
    organization_id = to_record_id(
        "organizations",
        organization_id,
    )

    offset = (page - 1) * limit

    query = """
        SELECT *
        FROM deals
        WHERE organization_id = $organization_id
          AND (
              $search = NONE
              OR string::contains(
                  string::lowercase(title),
                  $search
              )
              OR string::contains(
                  string::lowercase(company_id.name ?? ''),
                  $search
              )
              OR string::contains(
                  string::lowercase(contact_id.name ?? ''),
                  $search
              )
              OR string::contains(
                  string::lowercase(stage_id.name ?? ''),
                  $search
              )
          )
        ORDER BY created_at DESC, id DESC
        START $offset;
    """

    result = await db.query(
        query,
        {
            "organization_id": organization_id,
            "offset": offset,
            "search": search,
        },
    )

    if not isinstance(result, list):
        return []

    return result[:limit]


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
    company_record = to_record_id(
        "companies",
        company_id,
    )

    organization_record = to_record_id(
        "organizations",
        organization_id,
    )

    query = """
        SELECT *
        FROM $company_id
        WHERE organization_id = $organization_id;
    """

    return await db.query(
        query,
        {
            "company_id": company_record,
            "organization_id": organization_record,
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

async def count_deals(
    db: AsyncSurreal,
    organization_id: str,
    search: str | None = None,
):
    organization_id = to_record_id(
        "organizations",
        organization_id,
    )

    result = await db.query(
        """
        SELECT count() AS total
        FROM deals
        WHERE organization_id = $organization_id
          AND (
              $search = NONE
              OR string::contains(
                  string::lowercase(title),
                  $search
              )
              OR string::contains(
                  string::lowercase(company_id.name ?? ''),
                  $search
              )
              OR string::contains(
                  string::lowercase(contact_id.name ?? ''),
                  $search
              )
              OR string::contains(
                  string::lowercase(stage_id.name ?? ''),
                  $search
              )
          )
        GROUP ALL;
        """,
        {
            "organization_id": organization_id,
            "search": search,
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