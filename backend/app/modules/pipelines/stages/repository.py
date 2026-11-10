
from surrealdb import AsyncSurreal, RecordID


def to_record_id(table: str, record_id: str) -> RecordID:
    if ":" in record_id:
        record_id = record_id.split(":", 1)[1]

    return RecordID(table, record_id)


async def get_stages(
    db: AsyncSurreal,
    pipeline_id: str,
    page: int = 1,
    limit: int = 10,
):
    pipeline_id = to_record_id("pipelines", pipeline_id)

    offset = (page - 1) * limit

    query = """
        SELECT *
        FROM stages
        WHERE pipeline_id = $pipeline_id
        ORDER BY position ASC, id ASC
        START $offset;
    """

    result = await db.query(
        query,
        {
            "pipeline_id": pipeline_id,
            "offset": offset,
        },
    )

    if not isinstance(result, list):
        return []

    return result[:limit]


async def count_stages(
    db: AsyncSurreal,
    pipeline_id: str,
):
    pipeline_id = to_record_id("pipelines", pipeline_id)

    result = await db.query(
        """
        SELECT count() AS total
        FROM stages
        WHERE pipeline_id = $pipeline_id
        GROUP ALL;
        """,
        {
            "pipeline_id": pipeline_id,
        },
    )

    if not isinstance(result, list):
        return 0

    for item in result:
        if not isinstance(item, dict):
            continue

        if "total" in item:
            return item["total"]

        rows = item.get("result")

        if isinstance(rows, list) and rows:
            return rows[0].get("total", 0)

        if isinstance(rows, dict):
            return rows.get("total", 0)

    return 0

async def get_stage_by_id(
    db: AsyncSurreal,
    stage_id: str,
    pipeline_id: str,
):
    stage_id = to_record_id("stages", stage_id)
    pipeline_id = to_record_id("pipelines", pipeline_id)

    query = """
        SELECT *
        FROM $stage_id
        WHERE pipeline_id = $pipeline_id;
    """

    return await db.query(
        query,
        {
            "stage_id": stage_id,
            "pipeline_id": pipeline_id,
        },
    )


async def stage_name_exists(
    db: AsyncSurreal,
    pipeline_id: str,
    name: str,
    exclude_stage_id: str | None = None,
):
    pipeline_id = to_record_id("pipelines", pipeline_id)

    query = """
        SELECT id
        FROM stages
        WHERE pipeline_id = $pipeline_id
        AND name = $name
    """

    params = {
        "pipeline_id": pipeline_id,
        "name": name,
    }

    if exclude_stage_id:
        query += " AND id != $exclude_stage_id"
        params["exclude_stage_id"] = to_record_id(
            "stages",
            exclude_stage_id,
        )

    query += " LIMIT 1;"

    result = await db.query(query, params)

    return bool(result)


async def stage_position_exists(
    db: AsyncSurreal,
    pipeline_id: str,
    position: int,
    exclude_stage_id: str | None = None,
):
    pipeline_id = to_record_id("pipelines", pipeline_id)

    query = """
        SELECT id
        FROM stages
        WHERE pipeline_id = $pipeline_id
        AND position = $position
    """

    params = {
        "pipeline_id": pipeline_id,
        "position": position,
    }

    if exclude_stage_id:
        query += " AND id != $exclude_stage_id"
        params["exclude_stage_id"] = to_record_id(
            "stages",
            exclude_stage_id,
        )

    query += " LIMIT 1;"

    result = await db.query(query, params)

    return bool(result)


async def create_stage(
    db: AsyncSurreal,
    pipeline_id: str,
    data: dict,
):
    pipeline_id = to_record_id("pipelines", pipeline_id)

    data["pipeline_id"] = pipeline_id

    query = """
        CREATE stages CONTENT $data
        RETURN AFTER;
    """

    return await db.query(
        query,
        {"data": data},
    )


async def update_stage(
    db: AsyncSurreal,
    stage_id: str,
    pipeline_id: str,
    data: dict,
):
    stage_id = to_record_id("stages", stage_id)
    pipeline_id = to_record_id("pipelines", pipeline_id)

    query = """
        UPDATE $stage_id
        MERGE $data
        WHERE pipeline_id = $pipeline_id
        RETURN AFTER;
    """

    return await db.query(
        query,
        {
            "stage_id": stage_id,
            "pipeline_id": pipeline_id,
            "data": data,
        },
    )


async def delete_stage(
    db: AsyncSurreal,
    stage_id: str,
    pipeline_id: str,
):
    stage_id = to_record_id("stages", stage_id)
    pipeline_id = to_record_id("pipelines", pipeline_id)

    query = """
        DELETE $stage_id
        WHERE pipeline_id = $pipeline_id
        RETURN BEFORE;
    """

    return await db.query(
        query,
        {
            "stage_id": stage_id,
            "pipeline_id": pipeline_id,
        },
    )
