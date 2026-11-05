
from surrealdb import AsyncSurreal, RecordID


def to_record_id(table: str, record_id: str) -> RecordID:
    if isinstance(record_id, RecordID):
        return record_id

    record_id = str(record_id)

    if ":" in record_id:
        record_id = record_id.split(":", 1)[1]

    return RecordID(table, record_id)

def serialize_record_ids(data):
    """
    Convert RecordID values to strings before returning API data.
    """
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

def extract_rows(response):
    if response is None:
        return []

    if isinstance(response, list):
        if not response:
            return []

        # SurrealDB SDK returns rows directly
        if all(isinstance(row, dict) for row in response):
            return response

        # Handle statement-based responses
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


async def create_organization(
    db: AsyncSurreal,
    name: str,
    slug: str,
    user_id: str,
):
    user_record = to_record_id("users", user_id)

    # Step 1: Create Organization
    organization_query = """
        CREATE organizations CONTENT {
            name: $name,
            slug: $slug,
            plan: 'FREE',
            is_active: true
        }
        RETURN AFTER;
    """

    organization_result = await db.query(
        organization_query,
        {
            "name": name,
            "slug": slug,
        },
    )

    organization_rows = extract_rows(organization_result)


    if not organization_rows:
        raise RuntimeError(
            f"Failed to create organization. "
            f"Raw response: {repr(organization_result)}"
    )
    organization = organization_rows[0]

    # เก็บ RecordID ไว้ใช้สร้าง Membership
    organization_record = organization["id"]

    # แปลงเป็น String เฉพาะข้อมูลที่จะส่งกลับ API
    organization["id"] = str(organization_record)

    # Step 3: Create Membership
    membership_query = """
        CREATE memberships CONTENT {
            organization_id: $organization_id,
            user_id: $user_id,
            role: 'ADMIN'
        }
        RETURN AFTER;
    """

    membership_result = await db.query(
        membership_query,
        {
            "organization_id": organization_record,
            "user_id": user_record,
        },
    )

    membership_rows = extract_rows(membership_result)

    if not membership_rows:
        raise RuntimeError(
            "Organization created but membership creation failed"
        )

    return organization



async def get_user_organizations(
    db: AsyncSurreal,
    user_id: str,
):
    user_record = to_record_id("users", user_id)

    query = """
        SELECT *
        FROM memberships
        WHERE user_id = $user_id;
    """

    result = await db.query(
        query,
        {"user_id": user_record},
    )

    memberships = extract_rows(result)
    organizations = []

    for membership in memberships:
        # Keep the original RecordID for database queries
        organization_id = membership.get("organization_id")

        if organization_id is None:
            continue

        organization_record = to_record_id(
            "organizations",
            organization_id,
        )

        organization_query = """
            SELECT *
            FROM $organization_id;
        """

        organization_result = await db.query(
            organization_query,
            {"organization_id": organization_record},
        )

        organization_rows = extract_rows(organization_result)

        if not organization_rows:
            continue

        organization = organization_rows[0]

        if not organization.get("is_active", True):
            continue

        # Convert RecordID to string for API response
        organization = serialize_record_ids(organization)

        organization["role"] = membership.get("role")

        organizations.append(organization)

    return organizations


async def get_organization_by_id(
    db: AsyncSurreal,
    organization_id: str,
):
    organization_record = to_record_id(
        "organizations",
        organization_id,
    )

    query = """
        SELECT *
        FROM $organization_id;
    """

    result = await db.query(
        query,
        {"organization_id": organization_record},
    )

    rows = extract_rows(result)

    if not rows:
        return None

    return serialize_record_ids(rows[0])


async def get_membership(
    db: AsyncSurreal,
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

    query = """
        SELECT *
        FROM memberships
        WHERE
            organization_id = $organization_id
            AND user_id = $user_id
        LIMIT 1;
    """

    result = await db.query(
        query,
        {
            "organization_id": organization_record,
            "user_id": user_record,
        },
    )

    rows = extract_rows(result)

    if not rows:
        return None

    return serialize_record_ids(rows[0])


async def update_organization(
    db: AsyncSurreal,
    organization_id: str,
    data: dict,
):
    organization_record = to_record_id(
        "organizations",
        organization_id,
    )

    query = """
        UPDATE $organization_id MERGE $data
        RETURN AFTER;
    """

    result = await db.query(
        query,
        {
            "organization_id": organization_record,
            "data": data,
        },
    )

    rows = extract_rows(result)

    if not rows:
        return None

    return serialize_record_ids(rows[0])


async def deactivate_organization(
    db: AsyncSurreal,
    organization_id: str,
):
    organization_record = to_record_id(
        "organizations",
        organization_id,
    )

    query = """
        UPDATE $organization_id MERGE {
            is_active: false,
            updated_at: time::now()
        }
        RETURN AFTER;
    """

    result = await db.query(
        query,
        {"organization_id": organization_record},
    )

    rows = extract_rows(result)

    if not rows:
        return None

    return serialize_record_ids(rows[0])
