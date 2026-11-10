
from surrealdb import AsyncSurreal, RecordID



def extract_rows(response) -> list[dict]:
    if not isinstance(response, list):
        return []

    rows = []

    for item in response:
        if not isinstance(item, dict):
            continue

        # รองรับ SurrealDB response แบบ result wrapper
        if "result" in item:
            result = item.get("result")

            if isinstance(result, list):
                rows.extend(
                    row for row in result
                    if isinstance(row, dict)
                )
            elif isinstance(result, dict):
                rows.append(result)

            continue

        # รองรับ Python Client ที่คืน List[Dict] โดยตรง
        rows.append(item)

    return rows



def to_organization_record_id(organization_id: str) -> RecordID:
    table_name, record_key = organization_id.split(":", 1)

    if table_name != "organizations" or not record_key:
        raise ValueError("Invalid organization ID")

    return RecordID(table_name, record_key)


async def search_companies(
    db: AsyncSurreal,
    organization_id: str,
    query: str,
):
    response = await db.query(
        """
        SELECT id, name, industry, phone
        FROM companies
        WHERE organization_id = $organization_id
        AND string::contains(
            string::lowercase(name),
            $query
        )
        LIMIT 5;
        """,
        {
            "organization_id": to_organization_record_id(organization_id),
            "query": query,
        },
    )

    return extract_rows(response)


async def search_contacts(
    db: AsyncSurreal,
    organization_id: str,
    query: str,
):
    response = await db.query(
        """
        SELECT id, name, email, position
        FROM contacts
        WHERE organization_id = $organization_id
        AND (
            string::contains(
                string::lowercase(name),
                $query
            )
            OR string::contains(
                string::lowercase(email),
                $query
            )
        )
        LIMIT 5;
        """,
        {
            "organization_id": to_organization_record_id(organization_id),
            "query": query,
        },
    )

    return extract_rows(response)


async def search_deals(
    db: AsyncSurreal,
    organization_id: str,
    query: str,
):
    response = await db.query(
        """
        SELECT id, title, status, currency
        FROM deals
        WHERE organization_id = $organization_id
        AND string::contains(
            string::lowercase(title),
            $query
        )
        LIMIT 5;
        """,
        {
            "organization_id": to_organization_record_id(organization_id),
            "query": query,
        },
    )

    return extract_rows(response)
