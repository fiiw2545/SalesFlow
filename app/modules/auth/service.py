from surrealdb import AsyncSurreal

from app.security.password import (
    hash_password,
    verify_password
)

from app.security.jwt import (
    create_access_token,
    create_refresh_token,
    decode_token
)

from app.schemas.role import UserRole


async def email_exists(
    db: AsyncSurreal,
    email: str
) -> bool:

    result = await db.query(
        "SELECT * FROM users WHERE email = $email",
        {"email": email}
    )

    return len(result) > 0


async def register_user(
    db: AsyncSurreal,
    name: str,
    email: str,
    password: str
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
            "password_hash": hashed_password
        }
    )

    return result


async def get_user_by_email(
    db: AsyncSurreal,
    email: str
):

    result = await db.query(
        """
        SELECT * FROM users
        WHERE email = $email
        LIMIT 1
        """,
        {"email": email}
    )

    if not result:
        return None

    return result[0]


def authenticate_user(
    user: dict,
    password: str
) -> bool:

    if not user:
        return False

    return verify_password(
        password,
        user["password_hash"]
    )


def is_user_active(user: dict) -> bool:

    if not user:
        return False

    return user["is_active"]


async def login_user(
    db: AsyncSurreal,
    email: str,
    password: str
):

    user = await get_user_by_email(db, email)

    if not user:
        return None

    if not authenticate_user(user, password):
        return None

    if not is_user_active(user):
        return None

    return user


def create_login_tokens(user: dict) -> dict:

    user_id = str(user["id"])

    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token
    }


async def get_user_by_id(
    db: AsyncSurreal,
    user_id: str
):

    result = await db.query(
        """
        SELECT * FROM type::record('users', $id)
        """,
        {"id": user_id.split(":", 1)[1]}
    )

    if not result:
        return None

    return result[0]


def validate_refresh_token(token: str):

    try:
        payload = decode_token(
            token,
            expected_type="refresh"
        )

        return payload

    except Exception:
        return None


async def refresh_user_session(
    db: AsyncSurreal,
    token: str
):

    payload = validate_refresh_token(token)

    if not payload:
        return None

    user_id = payload.get("sub")

    if not user_id:
        return None

    user = await get_user_by_id(db, user_id)

    if not user:
        return None

    if not is_user_active(user):
        return None

    return user


def validate_user_role(role: str) -> UserRole | None:

    try:
        return UserRole(role)

    except ValueError:
        return None


async def get_user_membership(
    db: AsyncSurreal,
    user_id: str,
    organization_id: str
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
            "organization_id": organization_id.split(":", 1)[1]
        }
    )

    if not result:
        return None

    return result[0]