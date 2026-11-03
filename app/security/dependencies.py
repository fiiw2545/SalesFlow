from fastapi import (
    Cookie,
    Depends,
    Header,
    HTTPException,
    status,
)

from surrealdb import AsyncSurreal

from app.schemas.role import UserRole
from app.database.dependencies import get_db
from app.security.jwt import decode_token

from app.modules.auth.service import (
    get_user_by_id,
    get_user_membership,
    validate_user_role,
)

async def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: AsyncSurreal = Depends(get_db)
):
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    try:
        payload = decode_token(
            access_token,
            expected_type="access"
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    user = await get_user_by_id(db, user_id)

    if not user or not user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    return user


async def get_current_user_id(
    current_user: dict = Depends(get_current_user)
) -> str:
    return str(current_user["id"])

def require_roles(*allowed_roles: UserRole):
    async def role_checker(
        current_role: UserRole = Depends(
            get_current_organization_role
        )
    ):
        if current_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied"
            )

        return current_role

    return role_checker

async def get_current_organization_id(
    organization_id: str = Header(
        alias="X-Organization-ID"
    )
) -> str:
    return organization_id

async def get_current_membership(
    current_user: dict = Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    db: AsyncSurreal = Depends(get_db)
):
    membership = await get_user_membership(
        db=db,
        user_id=str(current_user["id"]),
        organization_id=organization_id
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this organization"
        )

    return membership

async def get_current_organization_role(
    membership: dict = Depends(get_current_membership)
) -> UserRole:
    role = validate_user_role(membership["role"])

    if not role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid organization role"
        )

    return role