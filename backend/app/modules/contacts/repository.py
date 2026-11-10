from surrealdb import AsyncSurreal
from datetime import datetime, timezone
from surrealdb import RecordID

async def get_contacts(
    db: AsyncSurreal,
    organization_id: str,
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
):
    organization_record_id = RecordID(
        "organizations",
        organization_id.replace("organizations:", "")
    )

    offset = (page - 1) * limit

    search_filter = ""
    params = {
        "organization_id": organization_record_id,
        "limit": limit,
        "offset": offset,
    }

    if search:
        search_filter = """
            AND (
                string::contains(string::lowercase(name ?? ''), $search)
                OR string::contains(string::lowercase(email ?? ''), $search)
                OR string::contains(string::lowercase(phone ?? ''), $search)
                OR string::contains(string::lowercase(position ?? ''), $search)
            )
        """
        params["search"] = search

    query = f"""
        SELECT * FROM contacts
        WHERE organization_id = $organization_id
        {search_filter}
        ORDER BY created_at DESC
        LIMIT $limit
        START $offset
    """

    return await db.query(query, params)


async def get_contact_by_id(
    db: AsyncSurreal,
    contact_id: str,
    organization_id: str
):
    organization_record_id = RecordID(
        "organizations",
        organization_id.replace("organizations:", "")
    )

    return await db.query(
        """
        SELECT * FROM type::record('contacts', $id)
        WHERE organization_id = $organization_id
        """,
        {
            "id": contact_id,
            "organization_id": organization_record_id
        }
    )

async def get_company_by_id(
    db: AsyncSurreal,
    company_id: str,
    organization_id: str,
):
    company_record_id = RecordID(
        "companies",
        company_id.replace("companies:", "")
    )

    organization_record_id = RecordID(
        "organizations",
        organization_id.replace("organizations:", "")
    )

    return await db.query(
        """
        SELECT * FROM $company_id
        WHERE organization_id = $organization_id
        """,
        {
            "company_id": company_record_id,
            "organization_id": organization_record_id,
        }
    )

async def create_contact(
    db: AsyncSurreal,
    data: dict
):
    data["created_at"] = datetime.now(timezone.utc)

    data["created_by"] = RecordID(
    "users",
    str(data["created_by"]).replace("users:", "")
)

    data["organization_id"] = RecordID(
    "organizations",
    str(data["organization_id"]).replace("organizations:", "")
)
    if data.get("company_id"):
        data["company_id"] = RecordID(
            "companies",
        data["company_id"].replace("companies:", "")
    )

    return await db.query(
        "CREATE contacts CONTENT $data",
        {"data": data}
    )


async def update_contact(
    db: AsyncSurreal,
    contact_id: str,
    data: dict,
    organization_id: str
):
    organization_record_id = RecordID(
        "organizations",
        organization_id.replace("organizations:", "")
    )

    if data.get("company_id"):
        data["company_id"] = RecordID(
            "companies",
        data["company_id"].replace("companies:", "")
    )

    return await db.query(
        """
        UPDATE type::record('contacts', $id)
        MERGE $data
        WHERE organization_id = $organization_id
        """,
        {
            "id": contact_id,
            "data": data,
            "organization_id": organization_record_id
        }
    )


async def delete_contact(
    db: AsyncSurreal,
    contact_id: str,
    organization_id: str
):
    organization_record_id = RecordID(
        "organizations",
        organization_id.replace("organizations:", "")
    )

    return await db.query(
        """
        DELETE type::record('contacts', $id)
        WHERE organization_id = $organization_id
        RETURN BEFORE
        """,
        {
            "id": contact_id,
            "organization_id": organization_record_id
        }
    )

async def count_contacts(
    db: AsyncSurreal,
    organization_id: str,
    search: str | None = None,
):
    organization_record_id = RecordID(
        "organizations",
        organization_id.replace("organizations:", "")
    )

    search_filter = ""
    params = {
        "organization_id": organization_record_id
    }

    if search:
        search_filter = """
            AND (
                string::contains(string::lowercase(name ?? ''), $search)
                OR string::contains(string::lowercase(email ?? ''), $search)
                OR string::contains(string::lowercase(phone ?? ''), $search)
                OR string::contains(string::lowercase(position ?? ''), $search)
            )
        """
        params["search"] = search

    result = await db.query(
        f"""
        SELECT count() AS total
        FROM contacts
        WHERE organization_id = $organization_id
        {search_filter}
        GROUP ALL
        """,
        params
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