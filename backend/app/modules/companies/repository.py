from datetime import datetime, timezone

from surrealdb import AsyncSurreal, RecordID


def to_record_id(table: str, record_id) -> RecordID:
    if isinstance(record_id, RecordID):
        return record_id

    record_id = str(record_id)

    if ":" in record_id:
        record_id = record_id.split(":", 1)[1]

    return RecordID(table, record_id)


def extract_rows(response):
    if response is None:
        return []

    if isinstance(response, list):
        if not response:
            return []

        if all(isinstance(row, dict) for row in response):
            return response

        for statement in reversed(response):
            if isinstance(statement, dict):
                rows = statement.get("result")

                if isinstance(rows, list):
                    return rows

                if isinstance(rows, dict):
                    return [rows]

        return []

    if isinstance(response, dict):
        rows = response.get("result")

        if isinstance(rows, list):
            return rows

        if isinstance(rows, dict):
            return [rows]

        if "id" in response:
            return [response]

    return []


def serialize_record_ids(data):
    if isinstance(data, RecordID):
        return str(data)

    if isinstance(data, dict):
        return {
            key: serialize_record_ids(value)
            for key, value in data.items()
        }

    if isinstance(data, list):
        return [
            serialize_record_ids(item)
            for item in data
        ]

    return data


async def get_companies(
    db: AsyncSurreal,
    organization_id: str,
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
):
    organization_record = to_record_id(
        "organizations",
        organization_id,
    )

    offset = (page - 1) * limit

    search_filter = ""
    params = {
        "organization_id": organization_record,
        "limit": limit,
        "offset": offset,
    }

    if search:
        search_filter = """
            AND (
                string::contains(string::lowercase(name ?? ''), $search)
                OR string::contains(string::lowercase(industry ?? ''), $search)
                OR string::contains(string::lowercase(phone ?? ''), $search)
                OR string::contains(string::lowercase(address ?? ''), $search)
                OR string::contains(string::lowercase(website ?? ''), $search)
            )
        """
        params["search"] = search

    query = f"""
        SELECT *
        FROM companies
        WHERE organization_id = $organization_id
        {search_filter}
        ORDER BY created_at DESC
        LIMIT $limit
        START $offset;
    """

    result = await db.query(query, params)
    rows = extract_rows(result)

    return serialize_record_ids(rows)


async def count_companies(
    db: AsyncSurreal,
    organization_id: str,
    search: str | None = None,
):
    organization_record = to_record_id(
        "organizations",
        organization_id,
    )

    search_filter = ""
    params = {
        "organization_id": organization_record,
    }

    if search:
        search_filter = """
            AND (
                string::contains(string::lowercase(name ?? ''), $search)
                OR string::contains(string::lowercase(industry ?? ''), $search)
                OR string::contains(string::lowercase(phone ?? ''), $search)
                OR string::contains(string::lowercase(address ?? ''), $search)
                OR string::contains(string::lowercase(website ?? ''), $search)
            )
        """
        params["search"] = search

    query = f"""
        SELECT count() AS total
        FROM companies
        WHERE organization_id = $organization_id
        {search_filter}
        GROUP ALL;
    """

    result = await db.query(query, params)
    rows = extract_rows(result)

    if not rows:
        return 0

    return rows[0].get("total", 0)


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

    result = await db.query(
        query,
        {
            "company_id": company_record,
            "organization_id": organization_record,
        },
    )

    rows = extract_rows(result)

    if not rows:
        return None

    return serialize_record_ids(rows[0])


async def get_company_by_name(
    db: AsyncSurreal,
    name: str,
    organization_id: str,
):
    organization_record = to_record_id(
        "organizations",
        organization_id,
    )

    query = """
        SELECT *
        FROM companies
        WHERE organization_id = $organization_id
        AND name = $name;
    """

    result = await db.query(
        query,
        {
            "organization_id": organization_record,
            "name": name,
        },
    )

    rows = extract_rows(result)

    if not rows:
        return None

    return serialize_record_ids(rows[0])


async def create_company(
    db: AsyncSurreal,
    data: dict,
    organization_id: str,
    user_id: str,
):
    organization_record = to_record_id(
        "organizations",
        organization_id,
    )

    user_record = to_record_id(
        "users",
        user_id,
    )

    company_data = {
        **data,
        "organization_id": organization_record,
        "created_by": user_record,
    }

    query = """
        CREATE companies
        CONTENT $data
        RETURN AFTER;
    """

    result = await db.query(
        query,
        {
            "data": company_data,
        },
    )

    rows = extract_rows(result)

    if not rows:
        return None

    return serialize_record_ids(rows[0])


async def update_company(
    db: AsyncSurreal,
    company_id: str,
    data: dict,
):
    company_record = to_record_id(
        "companies",
        company_id,
    )

    update_data = {
        **data,
        "updated_at": datetime.now(timezone.utc),
    }

    query = """
        UPDATE $company_id
        MERGE $data
        RETURN AFTER;
    """

    result = await db.query(
        query,
        {
            "company_id": company_record,
            "data": update_data,
        },
    )

    rows = extract_rows(result)

    if not rows:
        return None

    return serialize_record_ids(rows[0])


async def get_company_contacts(
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
        SELECT id
        FROM contacts
        WHERE organization_id = $organization_id
        AND company_id = $company_id;
    """

    result = await db.query(
        query,
        {
            "company_id": company_record,
            "organization_id": organization_record,
        },
    )

    return extract_rows(result)


async def get_company_deals(
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
        SELECT id
        FROM deals
        WHERE organization_id = $organization_id
        AND company_id = $company_id;
    """

    result = await db.query(
        query,
        {
            "company_id": company_record,
            "organization_id": organization_record,
        },
    )

    return extract_rows(result)


async def delete_company(
    db: AsyncSurreal,
    company_id: str,
):
    company_record = to_record_id(
        "companies",
        company_id,
    )

    query = """
        DELETE $company_id
        RETURN BEFORE;
    """

    result = await db.query(
        query,
        {
            "company_id": company_record,
        },
    )

    rows = extract_rows(result)

    if not rows:
        return None

    return serialize_record_ids(rows[0])
