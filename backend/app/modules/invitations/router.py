
from fastapi import (
    APIRouter,
    Depends,
    Cookie,
    HTTPException,
    Response,
    status,
)

from surrealdb import AsyncSurreal

from app.database.dependencies import get_db
from app.core.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)

from app.common.dependencies import (
    get_current_user,
    get_current_user_id,
    get_current_organization_id,
    get_current_membership,
)

from app.modules.auth.service import get_user_by_id

from app.modules.invitations.schemas import (
    InvitationCreate,
    InvitationCreateResponse,
    InvitationValidateResponse,
    InvitationAcceptRequest,
    InvitationAcceptResponse,
    InvitationListResponse,
    InvitationRevokeResponse,
)

from app.modules.invitations.service import (
    create_invitation,
    list_invitations,
    validate_invitation,
    accept_invitation,
    revoke_invitation,
)


router = APIRouter(
    prefix="/invitations",
    tags=["Invitations"],
)


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
):
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )


async def get_optional_current_user(
    access_token: str | None,
    db: AsyncSurreal,
):
    if not access_token:
        return None

    from app.common.dependencies import get_current_user

    return await get_current_user(
        access_token=access_token,
        db=db,
    )


@router.post(
    "/",
    response_model=InvitationCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_invitation(
    data: InvitationCreate,
    db: AsyncSurreal = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    current_membership: dict = Depends(get_current_membership),
):
    return await create_invitation(
        db=db,
        email=str(data.email),
        role=data.role,
        organization_id=organization_id,
        current_user=current_user,
        current_membership=current_membership,
    )


@router.get(
    "/",
    response_model=InvitationListResponse,
)
async def get_invitations(
    db: AsyncSurreal = Depends(get_db),
    organization_id: str = Depends(get_current_organization_id),
    current_membership: dict = Depends(get_current_membership),
):
    return await list_invitations(
        db=db,
        organization_id=organization_id,
        current_membership=current_membership,
    )


@router.get(
    "/validate/{token}",
    response_model=InvitationValidateResponse,
)
async def validate_invitation_token(
    token: str,
    db: AsyncSurreal = Depends(get_db),
):
    return await validate_invitation(
        db=db,
        token=token,
    )


@router.post(
    "/accept",
    response_model=InvitationAcceptResponse,
)
async def accept_invitation_endpoint(
    data: InvitationAcceptRequest,
    response: Response,
    access_token: str | None = Cookie(default=None),
    db: AsyncSurreal = Depends(get_db),
):
    current_user = await get_optional_current_user(
        access_token=access_token,
        db=db,
    )

    result = await accept_invitation(
        db=db,
        token=data.token,
        current_user=current_user,
        name=data.name,
        password=data.password,
    )

    set_auth_cookies(
        response=response,
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
    )

    return {
        "user_id": str(result["user"]["id"]),
        "organization_id": result["organization_id"],
        "role": result["role"],
        "message": result["message"],
    }


@router.post(
    "/{invitation_id}/revoke",
    response_model=InvitationRevokeResponse,
)
async def revoke_invitation_endpoint(
    invitation_id: str,
    db: AsyncSurreal = Depends(get_db),
    organization_id: str = Depends(get_current_organization_id),
    current_membership: dict = Depends(get_current_membership),
):
    return await revoke_invitation(
        db=db,
        invitation_id=invitation_id,
        organization_id=organization_id,
        current_membership=current_membership,
    )
