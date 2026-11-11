
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from surrealdb import AsyncSurreal

from app.core.config import REFRESH_TOKEN_EXPIRE_DAYS

from app.security.password import (
    hash_password,
    verify_password,
)

from app.security.jwt import (
    create_access_token,
    create_refresh_token,
    decode_token,
)

from app.schemas.role import UserRole

from app.modules.auth.repository import (
    create_session,
    get_active_session,
    rotate_session,
    revoke_session,
)


async def email_exists(
    db: AsyncSurreal,
    email: str,
) -> bool:
    result = await db.query(
        "SELECT * FROM users WHERE email = $email",
        {"email": email},
    )

    return len(result) > 0


async def register_user(
    db: AsyncSurreal,
    name: str,
    email: str,
    password: str,
):
    exists = await email_exists(db, email)

    if exists:
        return None

    hashed_password = hash_password(password)

    result = await db.query(
        """
        CREATE users CONTENT {
            name: $name,
            email: $email,
            password_hash: $password_hash
        }
        """,
        {
            "name": name,
            "email": email,
            "password_hash": hashed_password,
        },
    )

    return result


async def get_user_by_email(
    db: AsyncSurreal,
    email: str,
):
    result = await db.query(
        """
        SELECT * FROM users
        WHERE email = $email
        LIMIT 1
        """,
        {"email": email},
    )

    if not result:
        return None

    return result[0]


def authenticate_user(
    user: dict,
    password: str,
) -> bool:
    if not user:
        return False

    return verify_password(
        password,
        user["password_hash"],
    )


def is_user_active(user: dict) -> bool:
    if not user:
        return False

    return user["is_active"]


async def login_user(
    db: AsyncSurreal,
    email: str,
    password: str,
):
    user = await get_user_by_email(db, email)

    if not user:
        return None

    if not authenticate_user(user, password):
        return None

    if not is_user_active(user):
        return None

    return user


async def create_login_tokens(
    db: AsyncSurreal,
    user: dict,
) -> dict:
    user_id = str(user["id"])

    sid = uuid4().hex
    refresh_jti = uuid4().hex

    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )

    session = await create_session(
        db=db,
        sid=sid,
        user_id=user_id,
        refresh_jti=refresh_jti,
        expires_at=expires_at,
    )

    if not session:
        raise RuntimeError("Unable to create login session")

    return {
        "access_token": create_access_token(
            user_id=user_id,
            sid=sid,
        ),
        "refresh_token": create_refresh_token(
            user_id=user_id,
            sid=sid,
            jti=refresh_jti,
        ),
    }


def validate_refresh_token(token: str):
    try:
        payload = decode_token(
            token,
            expected_type="refresh",
        )

        if not payload.get("sub"):
            return None

        if not payload.get("sid"):
            return None

        if not payload.get("jti"):
            return None

        return payload

    except Exception:
        return None


async def refresh_user_session(
    db: AsyncSurreal,
    token: str,
):
    payload = validate_refresh_token(token)

    if not payload:
        return None

    user_id = payload["sub"]
    sid = payload["sid"]
    old_jti = payload["jti"]

    user = await get_user_by_id(
        db=db,
        user_id=user_id,
    )

    if not user or not is_user_active(user):
        return None

    new_jti = uuid4().hex

    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )

    rotated = await rotate_session(
        db=db,
        sid=sid,
        old_jti=old_jti,
        new_jti=new_jti,
        expires_at=expires_at,
    )

    if not rotated:
        await revoke_session(
            db=db,
            sid=sid,
        )
        return None

    return {
        "user": user,
        "access_token": create_access_token(
            user_id=user_id,
            sid=sid,
        ),
        "refresh_token": create_refresh_token(
            user_id=user_id,
            sid=sid,
            jti=new_jti,
        ),
    }


async def logout_user_session(
    db: AsyncSurreal,
    access_token: str | None,
    refresh_token: str | None,
):
    session_ids = set()

    for token, token_type in (
        (access_token, "access"),
        (refresh_token, "refresh"),
    ):
        if not token:
            continue

        try:
            payload = decode_token(
                token,
                expected_type=token_type,
            )

            sid = payload.get("sid")

            if sid:
                session_ids.add(sid)

        except Exception:
            continue

    for sid in session_ids:
        await revoke_session(
            db=db,
            sid=sid,
        )


def validate_user_role(role: str) -> UserRole | None:
    try:
        return UserRole(role)

    except ValueError:
        return None


async def get_user_by_id(
    db: AsyncSurreal,
    user_id: str,
):
    result = await db.query(
        """
        SELECT * FROM type::record('users', $id)
        """,
        {"id": user_id.split(":", 1)[1]},
    )

    if not result:
        return None

    return result[0]


async def get_user_membership(
    db: AsyncSurreal,
    user_id: str,
    organization_id: str,
):
    result = await db.query(
        """
        SELECT * FROM memberships
        WHERE user_id = type::record('users', $user_id)
        AND organization_id = type::record('organizations', $organization_id)
        LIMIT 1
        """,
        {
            "user_id": user_id.split(":", 1)[1],
            "organization_id": organization_id.split(":", 1)[1],
        },
    )

    if not result:
        return None

    return result[0]


async def update_user_profile(
    db: AsyncSurreal,
    user_id: str,
    name: str,
):
    await db.query(
        """
        UPDATE type::record('users', $id)
        SET name = $name
        """,
        {
            "id": user_id.split(":", 1)[1],
            "name": name,
        },
    )

    return await get_user_by_id(
        db=db,
        user_id=user_id,
    )


async def change_user_password(
    db: AsyncSurreal,
    user_id: str,
    current_password: str,
    new_password: str,
) -> str:
    user = await get_user_by_id(
        db=db,
        user_id=user_id,
    )

    if not user:
        return "user_not_found"

    if not verify_password(
        current_password,
        user["password_hash"],
    ):
        return "invalid_current_password"

    if verify_password(
        new_password,
        user["password_hash"],
    ):
        return "same_password"

    hashed_password = hash_password(new_password)

    await db.query(
        """
        UPDATE type::record('users', $id)
        SET password_hash = $password_hash
        """,
        {
            "id": user_id.split(":", 1)[1],
            "password_hash": hashed_password,
        },
    )

    return "success"
