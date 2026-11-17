
from surrealdb import AsyncSurreal, RecordID


def to_record_id(table: str, value):
    if isinstance(value, RecordID):
        return value

    value = str(value)

    if ":" in value:
        value = value.split(":", 1)[1]

    return RecordID(table, value)



def extract_rows(response):
    if isinstance(response, list):
        rows = []

        for item in response:
            if isinstance(item, dict):
                result = item.get("result")

                if isinstance(result, list):
                    rows.extend(result)
                elif isinstance(result, dict):
                    rows.append(result)
                elif "id" in item or "total" in item:
                    rows.append(item)

        return rows

    if isinstance(response, dict):
        result = response.get("result", [])

        if isinstance(result, list):
            return result

        if isinstance(result, dict):
            return [result]

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


async def create_file(db: AsyncSurreal, data: dict):
    response = await db.query(
        "CREATE files CONTENT $data RETURN AFTER",
        {"data": data},
    )

    rows = extract_rows(response)

    if not rows:
        return None

    return serialize_record_ids(rows[0])


async def get_file_by_id(
    db: AsyncSurreal,
    file_id: str,
    organization_id: str,
):
    response = await db.query(
        """
        SELECT * FROM $file_id
        WHERE organization_id = $organization_id
        LIMIT 1
        """,
        {
            "file_id": to_record_id("files", file_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )

    rows = extract_rows(response)

    if not rows:
        return None

    return serialize_record_ids(rows[0])


async def get_files(
    db: AsyncSurreal,
    organization_id: str,
    limit: int,
    offset: int,
):
    response = await db.query(
        """
        SELECT * FROM files
        WHERE organization_id = $organization_id
        ORDER BY created_at DESC
        LIMIT $limit
        START $offset
        """,
        {
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
            "limit": limit,
            "offset": offset,
        },
    )

    rows = extract_rows(response)

    return serialize_record_ids(rows)


async def count_files(
    db: AsyncSurreal,
    organization_id: str,
):
    response = await db.query(
        """
        SELECT count() AS total FROM files
        WHERE organization_id = $organization_id
        GROUP ALL
        """,
        {
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )

    rows = extract_rows(response)

    if not rows:
        return 0

    return int(rows[0].get("total", 0))


async def delete_file(
    db: AsyncSurreal,
    file_id: str,
):
    response = await db.query(
        "DELETE $file_id RETURN BEFORE",
        {
            "file_id": to_record_id("files", file_id),
        },
    )

    rows = extract_rows(response)

    if not rows:
        return None

    return serialize_record_ids(rows[0])



async def get_avatar_file(
    db: AsyncSurreal,
    file_id: str,
    user_id: str,
):
    response = await db.query(
        """
        SELECT * FROM $file_id
        WHERE owner_user_id = $user_id
        AND organization_id = NONE
        AND category = "IMAGE"
        LIMIT 1
        """,
        {
            "file_id": to_record_id("files", file_id),
            "user_id": to_record_id("users", user_id),
        },
    )

    rows = extract_rows(response)

    if not rows:
        return None

    return serialize_record_ids(rows[0])


async def set_user_avatar(
    db: AsyncSurreal,
    user_id: str,
    file_id: str | None,
):
    if file_id is None:
        response = await db.query(
            """
            UPDATE $user_id
            SET avatar_file_id = NONE
            RETURN AFTER
            """,
            {
                "user_id": to_record_id("users", user_id),
            },
        )
    else:
        response = await db.query(
            """
            UPDATE $user_id
            SET avatar_file_id = $file_id
            RETURN AFTER
            """,
            {
                "user_id": to_record_id("users", user_id),
                "file_id": to_record_id("files", file_id),
            },
        )

    rows = extract_rows(response)

    if not rows:
        return None

    return serialize_record_ids(rows[0])
