from datetime import datetime

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
            if not isinstance(item, dict):
                continue

            result = item.get("result")

            if isinstance(result, list):
                rows.extend(
                    row for row in result
                    if isinstance(row, dict)
                )
            elif isinstance(result, dict):
                rows.append(result)
            elif "id" in item or "line_user_id" in item:
                rows.append(item)

        return rows

    if isinstance(response, dict):
        result = response.get("result", [])

        if isinstance(result, list):
            return result

        if isinstance(result, dict):
            return [result]

        if "id" in response or "line_user_id" in response:
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


async def get_user_line_id(
    db: AsyncSurreal,
    user_id: str,
):
    response = await db.query(
        """
        SELECT line_user_id
        FROM $user_id
        LIMIT 1
        """,
        {
            "user_id": to_record_id("users", user_id),
        },
    )

    rows = extract_rows(response)

    if not rows:
        return None

    return rows[0].get("line_user_id")


async def create_link_code(
    db: AsyncSurreal,
    user_id: str,
    code_hash: str,
    expires_at: datetime,
):
    user_record = to_record_id("users", user_id)

    # Invalidate previous unused codes for this user.
    await db.query(
        """
        UPDATE line_link_codes
        SET used_at = time::now()
        WHERE user_id = $user_id
        AND used_at = NONE
        """,
        {
            "user_id": user_record,
        },
    )

    response = await db.query(
        """
        CREATE line_link_codes CONTENT {
            code_hash: $code_hash,
            user_id: $user_id,
            expires_at: $expires_at,
            used_at: NONE
        }
        RETURN AFTER
        """,
        {
            "code_hash": code_hash,
            "user_id": user_record,
            "expires_at": expires_at,
        },
    )

    rows = extract_rows(response)

    if not rows:
        return None

    return serialize_record_ids(rows[0])


async def claim_link_code(
    db: AsyncSurreal,
    code_hash: str,
):
    """
    Atomically claim an unused, unexpired code.
    Only one webhook request can claim it successfully.
    """
    response = await db.query(
        """
        UPDATE line_link_codes
        SET used_at = time::now()
        WHERE code_hash = $code_hash
        AND used_at = NONE
        AND expires_at > time::now()
        RETURN AFTER
        """,
        {
            "code_hash": code_hash,
        },
    )

    rows = extract_rows(response)

    if not rows:
        return None

    return serialize_record_ids(rows[0])


async def set_user_line_id(
    db: AsyncSurreal,
    user_id: str,
    line_user_id: str,
):
    response = await db.query(
        """
        UPDATE $user_id
        SET line_user_id = $line_user_id
        WHERE line_user_id = NONE
        RETURN AFTER
        """,
        {
            "user_id": to_record_id("users", user_id),
            "line_user_id": line_user_id,
        },
    )

    rows = extract_rows(response)

    if not rows:
        return None

    return serialize_record_ids(rows[0])


async def disconnect_user_line(
    db: AsyncSurreal,
    user_id: str,
):
    response = await db.query(
        """
        UPDATE $user_id
        SET line_user_id = NONE
        RETURN AFTER
        """,
        {
            "user_id": to_record_id("users", user_id),
        },
    )

    rows = extract_rows(response)

    if not rows:
        return None

    return serialize_record_ids(rows[0])