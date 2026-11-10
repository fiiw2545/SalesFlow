
from fastapi import APIRouter, Depends, Query
from surrealdb import AsyncSurreal

from app.database.dependencies import get_db
from app.security.dependencies import (
    get_current_organization_id,
    get_current_membership,
)

from app.modules.search.schemas import SearchResponse
from app.modules.search.service import global_search


router = APIRouter(
    prefix="/search",
    tags=["Search"],
)


@router.get(
    "/",
    response_model=SearchResponse,
)
async def search(
    q: str = Query(
        ...,
        min_length=2,
        max_length=100,
    ),
    db: AsyncSurreal = Depends(get_db),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    return await global_search(
        db=db,
        organization_id=organization_id,
        query=q,
    )
