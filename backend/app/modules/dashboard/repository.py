
from surrealdb import AsyncSurreal, RecordID


def to_record_id(table: str, record_id: str) -> RecordID:
    if isinstance(record_id, RecordID):
        return record_id

    record_id = str(record_id)

    if ":" in record_id:
        record_id = record_id.split(":", 1)[1]

    return RecordID(table, record_id)


def build_deal_date_filter(
    organization_id,
    start_date=None,
    end_date=None,
):
    conditions = ["organization_id = $organization_id"]

    params = {
        "organization_id": to_record_id(
            "organizations",
            organization_id,
        ),
    }

    if start_date is not None:
        conditions.append("created_at >= $start_date")
        params["start_date"] = start_date

    if end_date is not None:
        conditions.append("created_at <= $end_date")
        params["end_date"] = end_date

    return " AND ".join(conditions), params


async def get_deal_summary(
    db: AsyncSurreal,
    organization_id,
    start_date=None,
    end_date=None,
):
    where_clause, params = build_deal_date_filter(
        organization_id,
        start_date,
        end_date,
    )

    query = f"""
        SELECT
            count() AS total_deals,
            math::sum(value) AS total_value
        FROM deals
        WHERE {where_clause}
        GROUP ALL;
    """

    return await db.query(query, params)


async def get_deals_by_status(
    db: AsyncSurreal,
    organization_id,
    start_date=None,
    end_date=None,
):
    where_clause, params = build_deal_date_filter(
        organization_id,
        start_date,
        end_date,
    )

    query = f"""
        SELECT
            status,
            count() AS count,
            math::sum(value) AS total_value
        FROM deals
        WHERE {where_clause}
        GROUP BY status;
    """

    return await db.query(query, params)


async def get_deals_by_stage(
    db: AsyncSurreal,
    organization_id,
    start_date=None,
    end_date=None,
):
    where_clause, params = build_deal_date_filter(
        organization_id,
        start_date,
        end_date,
    )

    query = f"""
        SELECT
            stage_id,
            stage_id.name AS stage_name,
            count() AS count,
            math::sum(value) AS total_value
        FROM deals
        WHERE {where_clause}
        GROUP BY stage_id;
    """

    return await db.query(query, params)


async def get_deals_report(
    db: AsyncSurreal,
    organization_id,
    start_date=None,
    end_date=None,
):
    where_clause, params = build_deal_date_filter(
        organization_id,
        start_date,
        end_date,
    )

    query = f"""
        SELECT
            id,
            title,
            value,
            currency,
            status,
            created_at,
            expected_close_date,
            stage_id,
            company_id,
            contact_id
        FROM deals
        WHERE {where_clause}
        ORDER BY created_at DESC;
    """

    return await db.query(query, params)


async def get_task_summary(db: AsyncSurreal, organization_id):
    organization_id = to_record_id("organizations", organization_id)

    query = """
        SELECT
            status,
            count() AS count
        FROM tasks
        WHERE organization_id = $organization_id
        GROUP BY status;
    """

    return await db.query(query, {
        "organization_id": organization_id,
    })


async def get_overdue_task_count(db: AsyncSurreal, organization_id):
    organization_id = to_record_id("organizations", organization_id)

    query = """
        SELECT count() AS count
        FROM tasks
        WHERE
            organization_id = $organization_id
            AND status != 'COMPLETED'
            AND status != 'CANCELLED'
            AND due_date < time::now()
        GROUP ALL;
    """

    return await db.query(query, {
        "organization_id": organization_id,
    })


async def get_activity_count(db: AsyncSurreal, organization_id):
    organization_id = to_record_id("organizations", organization_id)

    query = """
        SELECT count() AS count
        FROM activities
        WHERE organization_id = $organization_id
        GROUP ALL;
    """

    return await db.query(query, {
        "organization_id": organization_id,
    })
