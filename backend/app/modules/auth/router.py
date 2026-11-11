
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Response,
    Cookie,
)

from surrealdb import AsyncSurreal

from app.database.dependencies import get_db

from app.modules.auth.schemas import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    LoginResponse,
    LogoutResponse,
    RefreshResponse,
    UpdateProfileRequest,
    ProfileUpdateResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
)

from app.modules.auth.service import (
    register_user,
    login_user,
    create_login_tokens,
    refresh_user_session,
    logout_user_session,
    update_user_profile,
    change_user_password,
)

from app.core.config import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)

from app.common.dependencies import (
    get_current_user,
    get_current_user_id,
    require_roles,
)

from app.schemas.role import UserRole


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
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


def clear_auth_cookies(response: Response):
    response.delete_cookie(
        key="access_token",
        path="/",
        httponly=True,
        secure=False,
        samesite="lax",
    )

    response.delete_cookie(
        key="refresh_token",
        path="/",
        httponly=True,
        secure=False,
        samesite="lax",
    )


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    user: RegisterRequest,
    db: AsyncSurreal = Depends(get_db),
):
    result = await register_user(
        db=db,
        name=user.name,
        email=user.email,
        password=user.password,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    created_user = result[0]

    return {
        "id": str(created_user["id"]),
        "name": created_user["name"],
        "email": created_user["email"],
        "message": "User registered successfully",
    }


@router.post(
    "/login",
    response_model=LoginResponse,
)
async def login(
    user: LoginRequest,
    response: Response,
    db: AsyncSurreal = Depends(get_db),
):
    authenticated_user = await login_user(
        db=db,
        email=user.email,
        password=user.password,
    )

    if not authenticated_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    tokens = await create_login_tokens(
        db=db,
        user=authenticated_user,
    )

    set_auth_cookies(
        response=response,
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
    )

    return {
        "id": str(authenticated_user["id"]),
        "name": authenticated_user["name"],
        "email": authenticated_user["email"],
        "message": "Login successful",
    }


@router.post(
    "/logout",
    response_model=LogoutResponse,
)
async def logout(
    response: Response,
    access_token: str | None = Cookie(default=None),
    refresh_token: str | None = Cookie(default=None),
    db: AsyncSurreal = Depends(get_db),
):
    try:
        await logout_user_session(
            db=db,
            access_token=access_token,
            refresh_token=refresh_token,
        )
    finally:
        clear_auth_cookies(response)

    return {
        "message": "Logout successful",
    }


@router.get("/me")
async def get_me(
    current_user: dict = Depends(get_current_user),
):
    return {
        "id": str(current_user["id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "message": "Current user retrieved successfully",
    }


@router.get("/me/id")
async def get_me_id(
    user_id: str = Depends(get_current_user_id),
):
    return {
        "user_id": user_id,
        "message": "Current user ID retrieved successfully",
    }


@router.patch(
    "/me",
    response_model=ProfileUpdateResponse,
)
async def update_me(
    data: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSurreal = Depends(get_db),
):
    updated_user = await update_user_profile(
        db=db,
        user_id=str(current_user["id"]),
        name=data.name,
    )

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return {
        "id": str(updated_user["id"]),
        "name": updated_user["name"],
        "email": updated_user["email"],
        "message": "Profile updated successfully",
    }


@router.patch(
    "/change-password",
    response_model=ChangePasswordResponse,
)
async def change_password(
    data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSurreal = Depends(get_db),
):
    result = await change_user_password(
        db=db,
        user_id=str(current_user["id"]),
        current_password=data.current_password,
        new_password=data.new_password,
    )

    if result == "user_not_found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if result == "invalid_current_password":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    if result == "same_password":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password",
        )

    return {
        "message": "Password changed successfully",
    }


@router.post(
    "/refresh",
    response_model=RefreshResponse,
)
async def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: AsyncSurreal = Depends(get_db),
):
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found",
        )

    result = await refresh_user_session(
        db=db,
        token=refresh_token,
    )

    if not result:
        clear_auth_cookies(response)

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user = result["user"]

    set_auth_cookies(
        response=response,
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
    )

    return {
        "id": str(user["id"]),
        "name": user["name"],
        "email": user["email"],
        "message": "Token refreshed successfully",
    }


@router.get("/admin-only")
async def admin_only(
    current_role: UserRole = Depends(
        require_roles(UserRole.ADMIN)
    ),
):
    return {
        "message": "Welcome Admin!",
        "role": current_role.value,
    }


@router.get("/manager-only")
async def manager_only(
    current_role: UserRole = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
        )
    ),
):
    return {
        "message": "Welcome Manager!",
        "role": current_role.value,
    }


@router.get("/sales-access")
async def sales_access(
    current_role: UserRole = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.MANAGER,
            UserRole.SALES,
        )
    ),
):
    return {
        "message": "Sales area access granted!",
        "role": current_role.value,
    }
