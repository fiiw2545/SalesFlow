
import asyncio

from surrealdb import AsyncSurreal, RecordID

from app.core.config import (
    SURREALDB_URL,
    SURREALDB_USERNAME,
    SURREALDB_PASSWORD,
    SURREALDB_NAMESPACE,
    SURREALDB_DATABASE,
)


def to_record_id(table: str, record_id: str) -> RecordID:
    if isinstance(record_id, RecordID):
        return record_id

    record_id = str(record_id)

    if ":" in record_id:
        record_id = record_id.split(":", 1)[1]

    return RecordID(table, record_id)


async def _cleanup_test_data(data: dict):
    db = AsyncSurreal(SURREALDB_URL)

    try:
        await db.connect()

        await db.signin({
            "username": SURREALDB_USERNAME,
            "password": SURREALDB_PASSWORD,
        })

        await db.use(
            SURREALDB_NAMESPACE,
            SURREALDB_DATABASE,
        )

        # 1. Deals must be deleted before related records.
        for activity_id in reversed(data.get("activities", [])):
            await db.query(
                "DELETE $record_id;",
                {
                    "record_id": to_record_id("activities", activity_id),
                },
            )
        for note_id in reversed(data.get("notes", [])):
            await db.query(
                "DELETE $record_id;",
                {
                    "record_id": to_record_id("notes", note_id),
                },
            )
        for task_id in reversed(data.get("tasks", [])):
            await db.query(
                "DELETE $record_id;",
                {
                    "record_id": to_record_id("tasks", task_id),
                },
            )
        for deal_id in reversed(data.get("deals", [])):
            await db.query(
                "DELETE $record_id;",
                {
                    "record_id": to_record_id("deals", deal_id),
                },
            )

        # 2. Delete stages before pipelines.
        for stage_id in reversed(data.get("stages", [])):
            await db.query(
                "DELETE $record_id;",
                {
                    "record_id": to_record_id("stages", stage_id),
                },
            )

        for pipeline_id in reversed(data.get("pipelines", [])):
            await db.query(
                "DELETE $record_id;",
                {
                    "record_id": to_record_id("pipelines", pipeline_id),
                },
            )

        # 3. Delete contacts before companies.
        for contact_id in reversed(data.get("contacts", [])):
            await db.query(
                "DELETE $record_id;",
                {
                    "record_id": to_record_id("contacts", contact_id),
                },
            )

        for company_id in reversed(data.get("companies", [])):
            await db.query(
                "DELETE $record_id;",
                {
                    "record_id": to_record_id("companies", company_id),
                },
            )

        # 4. Delete organization memberships and organizations.
        for organization_id in reversed(data.get("organizations", [])):
            organization_record = to_record_id(
                "organizations",
                organization_id,
            )

            await db.query(
                """
                DELETE memberships
                WHERE organization_id = $organization_id;
                """,
                {"organization_id": organization_record},
            )

            await db.query(
                "DELETE $organization_id;",
                {"organization_id": organization_record},
            )

        # 5. Delete sessions, memberships, and users.
        for user_id in reversed(data.get("users", [])):
            user_record = to_record_id("users", user_id)

            await db.query(
                """
                DELETE sessions
                WHERE user_id = $user_id;
                """,
                {"user_id": user_record},
            )

            await db.query(
                """
                DELETE memberships
                WHERE user_id = $user_id;
                """,
                {"user_id": user_record},
            )

            await db.query(
                "DELETE $user_id;",
                {"user_id": user_record},
            )

    finally:
        await db.close()


def cleanup_test_data(data: dict):
    keys = (
        "users",
        "organizations",
        "companies",
        "contacts",
        "pipelines",
        "stages",
        "deals",
        "tasks",
        "activities",
    )

    if not any(data.get(key, []) for key in keys):
        return

    asyncio.run(_cleanup_test_data(data))
