
from surrealdb import AsyncSurreal


def _extract_first(result):
    if isinstance(result, list):
        if not result:
            return None

        first = result[0]

        if isinstance(first, dict) and "result" in first:
            rows = first["result"]

            if isinstance(rows, list) and rows:
                return rows[0]

        return first

    if isinstance(result, dict):
        rows = result.get("result")

        if isinstance(rows, list) and rows:
            return rows[0]

        if "id" in result:
            return result

    return None


async def create_session(db, sid, user_id, refresh_jti, expires_at):
    result = await db.query(
        """
        CREATE type::record('sessions', $sid)
        CONTENT {
            user_id: type::record('users', $user_id),
            refresh_jti: $refresh_jti,
            created_at: time::now(),
            last_used_at: time::now(),
            expires_at: $expires_at,
            revoked_at: NONE
        }
        RETURN AFTER
        """,
        {
            "sid": sid,
            "user_id": user_id.split(":", 1)[1],
            "refresh_jti": refresh_jti,
            "expires_at": expires_at,
        },
    )

    return _extract_first(result)


async def get_active_session(
    db: AsyncSurreal,
    sid: str,
):
    result = await db.query(
        """
        SELECT * FROM type::record('sessions', $sid)
        WHERE revoked_at = NONE
        AND expires_at > time::now()
        LIMIT 1
        """,
        {"sid": sid}
    )

    return _extract_first(result)


async def rotate_session(
    db: AsyncSurreal,
    sid: str,
    old_jti: str,
    new_jti: str,
    expires_at,
) -> bool:
    result = await db.query(
        """
        UPDATE type::record('sessions', $sid)
        SET
            refresh_jti = $new_jti,
            last_used_at = time::now(),
            expires_at = $expires_at
        WHERE refresh_jti = $old_jti
        AND revoked_at = NONE
        AND expires_at > time::now()
        RETURN AFTER
        """,
        {
            "sid": sid,
            "old_jti": old_jti,
            "new_jti": new_jti,
            "expires_at": expires_at,
        }
    )

    return _extract_first(result) is not None


async def revoke_session(
    db: AsyncSurreal,
    sid: str,
) -> bool:
    result = await db.query(
        """
        UPDATE type::record('sessions', $sid)
        SET revoked_at = time::now()
        WHERE revoked_at = NONE
        RETURN AFTER
        """,
        {"sid": sid}
    )

    return _extract_first(result) is not None
