
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


async def get_user(
    db: AsyncSurreal,
    user_id: str,
):
    user_record = to_record_id("users", user_id)

    result = await db.query(
        """
        SELECT *
        FROM $user_id;
        """,
        {"user_id": user_record},
    )

    rows = extract_rows(result)

    return rows[0] if rows else None


async def get_memberships(
    db: AsyncSurreal,
    organization_id: str,
):
    organization_record = to_record_id(
        "organizations",
        organization_id,
    )

    result = await db.query(
        """
        SELECT *
        FROM memberships
        WHERE organization_id = $organization_id
        ORDER BY joined_at ASC;
        """,
        {"organization_id": organization_record},
    )

    rows = extract_rows(result)

    return [
        serialize_record_ids(row)
        for row in rows
    ]


async def get_membership_by_id(
    db: AsyncSurreal,
    membership_id: str,
    organization_id: str,
):
    membership_record = to_record_id(
        "memberships",
        membership_id,
    )

    organization_record = to_record_id(
        "organizations",
        organization_id,
    )

    result = await db.query(
        """
        SELECT *
        FROM memberships
        WHERE
            id = $membership_id
            AND organization_id = $organization_id
        LIMIT 1;
        """,
        {
            "membership_id": membership_record,
            "organization_id": organization_record,
        },
    )

    rows = extract_rows(result)

    return serialize_record_ids(rows[0]) if rows else None


async def get_membership_by_user_id(
    db: AsyncSurreal,
    user_id: str,
    organization_id: str,
):
    user_record = to_record_id("users", user_id)

    organization_record = to_record_id(
        "organizations",
        organization_id,
    )

    result = await db.query(
        """
        SELECT *
        FROM memberships
        WHERE
            user_id = $user_id
            AND organization_id = $organization_id
        LIMIT 1;
        """,
        {
            "user_id": user_record,
            "organization_id": organization_record,
        },
    )

    rows = extract_rows(result)

    return rows[0] if rows else None


async def create_membership(
    db: AsyncSurreal,
    user_id: str,
    organization_id: str,
    role: str,
):
    user_record = to_record_id("users", user_id)

    organization_record = to_record_id(
        "organizations",
        organization_id,
    )

    result = await db.query(
        """
        CREATE memberships CONTENT {
            user_id: $user_id,
            organization_id: $organization_id,
            role: $role
        }
        RETURN AFTER;
        """,
        {
            "user_id": user_record,
            "organization_id": organization_record,
            "role": role,
        },
    )

    rows = extract_rows(result)

    if not rows:
        return None

    return serialize_record_ids(rows[0])


async def update_membership(
    db: AsyncSurreal,
    membership_id: str,
    role: str,
):
    membership_record = to_record_id(
        "memberships",
        membership_id,
    )

    result = await db.query(
        """
        UPDATE $membership_id MERGE {
            role: $role
        }
        RETURN AFTER;
        """,
        {
            "membership_id": membership_record,
            "role": role,
        },
    )

    rows = extract_rows(result)

    return serialize_record_ids(rows[0]) if rows else None


async def delete_membership(
    db: AsyncSurreal,
    membership_id: str,
):
    membership_record = to_record_id(
        "memberships",
        membership_id,
    )

    result = await db.query(
        """
        DELETE $membership_id
        RETURN BEFORE;
        """,
        {"membership_id": membership_record},
    )

    rows = extract_rows(result)

    return serialize_record_ids(rows[0]) if rows else None
