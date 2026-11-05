
from surrealdb import AsyncSurreal, RecordID


def to_record_id(table: str, record_id: str) -> RecordID:
    if ":" in record_id:
        record_id = record_id.split(":", 1)[1]

    return RecordID(table, record_id)


async def get_pipelines(
    db: AsyncSurreal,
    organization_id: str,
):
    organization_record = to_record_id("organizations", organization_id)

    query = """
        SELECT *
        FROM pipelines
        WHERE organization_id = $organization_id
        ORDER BY created_at DESC;
    """

    return await db.query(
        query,
        {"organization_id": organization_record},
    )


async def get_pipeline_by_id(
    db: AsyncSurreal,
    pipeline_id: str,
    organization_id: str,
):
    pipeline_record = to_record_id("pipelines", pipeline_id)
    organization_record = to_record_id("organizations", organization_id)

    query = """
        SELECT *
        FROM $pipeline_id
        WHERE organization_id = $organization_id;
    """

    return await db.query(
        query,
        {
            "pipeline_id": pipeline_record,
            "organization_id": organization_record,
        },
    )


async def pipeline_name_exists(
    db: AsyncSurreal,
    organization_id: str,
    name: str,
    exclude_pipeline_id: str | None = None,
):
    organization_record = to_record_id("organizations", organization_id)

    if exclude_pipeline_id:
        pipeline_record = to_record_id("pipelines", exclude_pipeline_id)

        query = """
            SELECT id
            FROM pipelines
            WHERE organization_id = $organization_id
              AND name = $name
              AND id != $pipeline_id
            LIMIT 1;
        """

        result = await db.query(
            query,
            {
                "organization_id": organization_record,
                "name": name,
                "pipeline_id": pipeline_record,
            },
        )
    else:
        query = """
            SELECT id
            FROM pipelines
            WHERE organization_id = $organization_id
              AND name = $name
            LIMIT 1;
        """

        result = await db.query(
            query,
            {
                "organization_id": organization_record,
                "name": name,
            },
        )

    return bool(result)


async def clear_other_default_pipelines(
    db: AsyncSurreal,
    organization_id: str,
    exclude_pipeline_id: str | None = None,
):
    organization_record = to_record_id("organizations", organization_id)

    if exclude_pipeline_id:
        pipeline_record = to_record_id("pipelines", exclude_pipeline_id)

        query = """
            UPDATE pipelines
            SET is_default = false
            WHERE organization_id = $organization_id
              AND is_default = true
              AND id != $pipeline_id;
        """

        return await db.query(
            query,
            {
                "organization_id": organization_record,
                "pipeline_id": pipeline_record,
            },
        )

    query = """
        UPDATE pipelines
        SET is_default = false
        WHERE organization_id = $organization_id
          AND is_default = true;
    """

    return await db.query(
        query,
        {"organization_id": organization_record},
    )


async def pipeline_has_stages(
    db: AsyncSurreal,
    pipeline_id: str,
):
    pipeline_record = to_record_id("pipelines", pipeline_id)

    query = """
        SELECT id
        FROM stages
        WHERE pipeline_id = $pipeline_id
        LIMIT 1;
    """

    result = await db.query(
        query,
        {"pipeline_id": pipeline_record},
    )

    return bool(result)


async def create_pipeline(
    db: AsyncSurreal,
    data: dict,
):
    data["organization_id"] = to_record_id(
        "organizations",
        data["organization_id"],
    )

    data["created_by"] = to_record_id(
        "users",
        data["created_by"],
    )

    query = """
        CREATE pipelines CONTENT $data
        RETURN AFTER;
    """

    return await db.query(
        query,
        {"data": data},
    )


async def update_pipeline(
    db: AsyncSurreal,
    pipeline_id: str,
    organization_id: str,
    data: dict,
):
    pipeline_record = to_record_id("pipelines", pipeline_id)
    organization_record = to_record_id("organizations", organization_id)

    query = """
        UPDATE $pipeline_id
        MERGE $data
        WHERE organization_id = $organization_id
        RETURN AFTER;
    """

    return await db.query(
        query,
        {
            "pipeline_id": pipeline_record,
            "organization_id": organization_record,
            "data": data,
        },
    )


async def delete_pipeline(
    db: AsyncSurreal,
    pipeline_id: str,
    organization_id: str,
):
    pipeline_record = to_record_id("pipelines", pipeline_id)
    organization_record = to_record_id("organizations", organization_id)

    query = """
        DELETE $pipeline_id
        WHERE organization_id = $organization_id
        RETURN BEFORE;
    """

    return await db.query(
        query,
        {
            "pipeline_id": pipeline_record,
            "organization_id": organization_record,
        },
    )
