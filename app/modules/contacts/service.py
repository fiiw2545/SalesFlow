
from surrealdb import AsyncSurreal

from app.modules.contacts import repository


async def get_contacts(
    db: AsyncSurreal,
    organization_id: str
):
    return await repository.get_contacts(
        db,
        organization_id
    )


async def get_contact_by_id(
    db: AsyncSurreal,
    contact_id: str,
    organization_id: str
):
    return await repository.get_contact_by_id(
        db,
        contact_id,
        organization_id
    )


async def create_contact(
    db: AsyncSurreal,
    data: dict
):
    return await repository.create_contact(
        db,
        data
    )


async def update_contact(
    db: AsyncSurreal,
    contact_id: str,
    data: dict,
    organization_id: str
):
    return await repository.update_contact(
        db,
        contact_id,
        data,
        organization_id
    )


async def delete_contact(
    db: AsyncSurreal,
    contact_id: str,
    organization_id: str
):
    return await repository.delete_contact(
        db,
        contact_id,
        organization_id
    )