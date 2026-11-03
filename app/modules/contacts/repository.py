from surrealdb import AsyncSurreal
from datetime import datetime, timezone
from surrealdb import RecordID

async def get_contacts(
    db: AsyncSurreal,
    organization_id: str
):
    organization_record_id = RecordID(
        "organizations",
        organization_id.replace("organizations:", "")
    )

    return await db.query(
        """
        SELECT * FROM contacts
        WHERE organization_id = $organization_id
        """,
        {
            "organization_id": organization_record_id
        }
    )


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