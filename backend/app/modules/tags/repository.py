from surrealdb import AsyncSurreal, RecordID


def to_record_id(table: str, record_id: str) -> RecordID:
    if ":" in record_id:
        record_id = record_id.split(":", 1)[1]

    return RecordID(table, record_id)


# -------------------------
# Tag CRUD
# -------------------------

async def get_tags(
    db: AsyncSurreal,
    organization_id: str,
):
    query = """
        SELECT *
        FROM tags
        WHERE organization_id = $organization_id
        ORDER BY created_at DESC;
    """

    return await db.query(
        query,
        {
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            )
        },
    )


async def get_tag_by_id(
    db: AsyncSurreal,
    tag_id: str,
    organization_id: str,
):
    query = """
        SELECT *
        FROM $tag_id
        WHERE organization_id = $organization_id;
    """

    return await db.query(
        query,
        {
            "tag_id": to_record_id("tags", tag_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )


async def create_tag(
    db: AsyncSurreal,
    data: dict,
):
    data["organization_id"] = to_record_id(
        "organizations",
        data["organization_id"],
    )

    query = """
        CREATE tags CONTENT $data
        RETURN AFTER;
    """

    return await db.query(query, {"data": data})


async def update_tag(
    db: AsyncSurreal,
    tag_id: str,
    organization_id: str,
    data: dict,
):
    query = """
        UPDATE $tag_id
        MERGE $data
        WHERE organization_id = $organization_id
        RETURN AFTER;
    """

    return await db.query(
        query,
        {
            "tag_id": to_record_id("tags", tag_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
            "data": data,
        },
    )


async def delete_tag(
    db: AsyncSurreal,
    tag_id: str,
    organization_id: str,
):
    query = """
        DELETE $tag_id
        WHERE organization_id = $organization_id
        RETURN BEFORE;
    """

    return await db.query(
        query,
        {
            "tag_id": to_record_id("tags", tag_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )


# -------------------------
# Validate related records
# -------------------------

async def get_company_by_id(
    db: AsyncSurreal,
    company_id: str,
    organization_id: str,
):
    query = """
        SELECT *
        FROM $company_id
        WHERE organization_id = $organization_id;
    """

    return await db.query(
        query,
        {
            "company_id": to_record_id("companies", company_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )


async def get_contact_by_id(
    db: AsyncSurreal,
    contact_id: str,
    organization_id: str,
):
    query = """
        SELECT *
        FROM $contact_id
        WHERE organization_id = $organization_id;
    """

    return await db.query(
        query,
        {
            "contact_id": to_record_id("contacts", contact_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )


# -------------------------
# Company Tags
# -------------------------

async def get_company_tags(
    db: AsyncSurreal,
    company_id: str,
    organization_id: str,
):
    query = """
        SELECT *
        FROM company_tags
        WHERE company_id = $company_id
        AND organization_id = $organization_id;
    """

    return await db.query(
        query,
        {
            "company_id": to_record_id("companies", company_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )


async def get_company_tag_link(
    db: AsyncSurreal,
    company_id: str,
    tag_id: str,
    organization_id: str,
):
    query = """
        SELECT *
        FROM company_tags
        WHERE company_id = $company_id
        AND tag_id = $tag_id
        AND organization_id = $organization_id;
    """

    return await db.query(
        query,
        {
            "company_id": to_record_id("companies", company_id),
            "tag_id": to_record_id("tags", tag_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )


async def create_company_tag(
    db: AsyncSurreal,
    company_id: str,
    tag_id: str,
    organization_id: str,
):
    query = """
        CREATE company_tags CONTENT {
            company_id: $company_id,
            tag_id: $tag_id,
            organization_id: $organization_id
        }
        RETURN AFTER;
    """

    return await db.query(
        query,
        {
            "company_id": to_record_id("companies", company_id),
            "tag_id": to_record_id("tags", tag_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )


async def delete_company_tag(
    db: AsyncSurreal,
    company_id: str,
    tag_id: str,
    organization_id: str,
):
    query = """
        DELETE company_tags
        WHERE company_id = $company_id
        AND tag_id = $tag_id
        AND organization_id = $organization_id
        RETURN BEFORE;
    """

    return await db.query(
        query,
        {
            "company_id": to_record_id("companies", company_id),
            "tag_id": to_record_id("tags", tag_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )


# -------------------------
# Contact Tags
# -------------------------

async def get_contact_tags(
    db: AsyncSurreal,
    contact_id: str,
    organization_id: str,
):
    query = """
        SELECT *
        FROM contact_tags
        WHERE contact_id = $contact_id
        AND organization_id = $organization_id;
    """

    return await db.query(
        query,
        {
            "contact_id": to_record_id("contacts", contact_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )


async def get_contact_tag_link(
    db: AsyncSurreal,
    contact_id: str,
    tag_id: str,
    organization_id: str,
):
    query = """
        SELECT *
        FROM contact_tags
        WHERE contact_id = $contact_id
        AND tag_id = $tag_id
        AND organization_id = $organization_id;
    """

    return await db.query(
        query,
        {
            "contact_id": to_record_id("contacts", contact_id),
            "tag_id": to_record_id("tags", tag_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )


async def create_contact_tag(
    db: AsyncSurreal,
    contact_id: str,
    tag_id: str,
    organization_id: str,
):
    query = """
        CREATE contact_tags CONTENT {
            contact_id: $contact_id,
            tag_id: $tag_id,
            organization_id: $organization_id
        }
        RETURN AFTER;
    """

    return await db.query(
        query,
        {
            "contact_id": to_record_id("contacts", contact_id),
            "tag_id": to_record_id("tags", tag_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )


async def delete_contact_tag(
    db: AsyncSurreal,
    contact_id: str,
    tag_id: str,
    organization_id: str,
):
    query = """
        DELETE contact_tags
        WHERE contact_id = $contact_id
        AND tag_id = $tag_id
        AND organization_id = $organization_id
        RETURN BEFORE;
    """

    return await db.query(
        query,
        {
            "contact_id": to_record_id("contacts", contact_id),
            "tag_id": to_record_id("tags", tag_id),
            "organization_id": to_record_id(
                "organizations",
                organization_id,
            ),
        },
    )

async def get_tag_usage(
    db: AsyncSurreal,
    tag_id: str,
    organization_id: str,
):
    company_query = """
        SELECT *
        FROM company_tags
        WHERE tag_id = $tag_id
        AND organization_id = $organization_id;
    """

    contact_query = """
        SELECT *
        FROM contact_tags
        WHERE tag_id = $tag_id
        AND organization_id = $organization_id;
    """

    params = {
        "tag_id": to_record_id("tags", tag_id),
        "organization_id": to_record_id(
            "organizations",
            organization_id,
        ),
    }

    company_result = await db.query(company_query, params)
    contact_result = await db.query(contact_query, params)

    return {
        "companies": company_result,
        "contacts": contact_result,
    }