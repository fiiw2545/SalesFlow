from surrealdb import AsyncSurreal

from app.modules.search.repository import (
    search_companies,
    search_contacts,
    search_deals,
)


def normalize_record_id(record_id) -> str:
    value = str(record_id)

    if ":" in value:
        return value.split(":", 1)[1]

    return value


async def global_search(
    db: AsyncSurreal,
    organization_id: str,
    query: str,
):
    normalized_query = query.strip().lower()

    companies_data = await search_companies(
        db=db,
        organization_id=organization_id,
        query=normalized_query,
    )

    contacts_data = await search_contacts(
        db=db,
        organization_id=organization_id,
        query=normalized_query,
    )

    deals_data = await search_deals(
        db=db,
        organization_id=organization_id,
        query=normalized_query,
    )

    companies = [
        {
            "type": "company",
            "id": normalize_record_id(item["id"]),
            "title": item["name"],
            "subtitle": item.get("industry") or item.get("phone"),
            "href": f"/companies",
        }
        for item in companies_data
    ]

    contacts = [
        {
            "type": "contact",
            "id": normalize_record_id(item["id"]),
            "title": item["name"],
            "subtitle": item.get("email") or item.get("position"),
            "href": "/contacts",
        }
        for item in contacts_data
    ]

    deals = [
        {
            "type": "deal",
            "id": normalize_record_id(item["id"]),
            "title": item["title"],
            "subtitle": item.get("status"),
            "href": "/deals",
        }
        for item in deals_data
    ]

    return {
        "query": query.strip(),
        "companies": companies,
        "contacts": contacts,
        "deals": deals,
        "total": len(companies) + len(contacts) + len(deals),
    }