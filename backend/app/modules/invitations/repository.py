
from surrealdb import AsyncSurreal, RecordID
from app.core.config import (
    SURREALDB_NAMESPACE,
    SURREALDB_DATABASE,
    SURREALDB_USERNAME,
    SURREALDB_PASSWORD,
)
from datetime import datetime, timezone

def to_record_id(table: str, record_id) -> RecordID:
    if isinstance(record_id, RecordID):
        return record_id

    value = str(record_id)

    if ":" in value:
        value = value.split(":", 1)[1]

    return RecordID(table, value)


def extract_rows(response):
    if response is None:
        return []

    if isinstance(response, list):
        if not response:
            return []

        if all(isinstance(row, dict) for row in response):
            return response

        for statement in reversed(response):
            if isinstance(statement, dict):
                rows = statement.get("result")

                if isinstance(rows, list):
                    return rows

                if isinstance(rows, dict):
                    return [rows]

        return []

    if isinstance(response, dict):
        rows = response.get("result")

        if isinstance(rows, list):
            return rows

        if isinstance(rows, dict):
            return [rows]

        if "id" in response:
            return [response]

    return []


def serialize_record_ids(data):
    if isinstance(data, RecordID):
        return str(data)

    if isinstance(data, dict):
        return {
            key: serialize_record_ids(value)
            for key, value in data.items()
        }

    if isinstance(data, list):
        return [
            serialize_record_ids(item)
            for item in data
        ]

    return data


async def get_user_by_email(db: AsyncSurreal, email: str):
    result = await db.query(
        """
        SELECT *
        FROM users
        WHERE email = $email
        LIMIT 1;
        """,
        {"email": email},
    )

    rows = extract_rows(result)
    return rows[0] if rows else None


async def get_organization(db: AsyncSurreal, organization_id: str):
    organization_record = to_record_id(
        "organizations",
        organization_id,
    )

    result = await db.query(
        """
        SELECT *
        FROM $organization_id
        LIMIT 1;
        """,
        {"organization_id": organization_record},
    )

    rows = extract_rows(result)
    return rows[0] if rows else None


async def get_membership_by_user_id(
    db: AsyncSurreal,
    user_id: str,
    organization_id: str,
):
    user_record = to_record_id("users", user_id)
    organization_record = to_record_id(
        "organizations",
        organization_id,
    )

    result = await db.query(
        """
        SELECT *
        FROM memberships
        WHERE user_id = $user_id
        AND organization_id = $organization_id
        LIMIT 1;
        """,
        {
            "user_id": user_record,
            "organization_id": organization_record,
        },
    )

    rows = extract_rows(result)
    return rows[0] if rows else None


async def get_pending_invitation(
    db: AsyncSurreal,
    email: str,
    organization_id: str,
):
    organization_record = to_record_id(
        "organizations",
        organization_id,
    )

    result = await db.query(
        """
        SELECT *
        FROM invitations
        WHERE email = $email
        AND organization_id = $organization_id
        AND status = 'PENDING'
        AND expires_at > time::now()
        ORDER BY created_at DESC
        LIMIT 1;
        """,
        {
            "email": email,
            "organization_id": organization_record,
        },
    )

    rows = extract_rows(result)
    return rows[0] if rows else None


async def create_invitation(
    db: AsyncSurreal,
    email: str,
    organization_id: str,
    invited_by: str,
    role: str,
    token_hash: str,
    expires_at,
):
    organization_record = to_record_id(
        "organizations",
        organization_id,
    )
    invited_by_record = to_record_id("users", invited_by)

    result = await db.query(
        """
        CREATE invitations CONTENT {
            email: $email,
            organization_id: $organization_id,
            invited_by: $invited_by,
            role: $role,
            token_hash: $token_hash,
            status: 'PENDING',
            expires_at: $expires_at
        }
        RETURN AFTER;
        """,
        {
            "email": email,
            "organization_id": organization_record,
            "invited_by": invited_by_record,
            "role": role,
            "token_hash": token_hash,
            "expires_at": expires_at,
        },
    )

    rows = extract_rows(result)
    return serialize_record_ids(rows[0]) if rows else None


async def get_invitation_by_token_hash(
    db: AsyncSurreal,
    token_hash: str,
):
    result = await db.query(
        """
        SELECT *
        FROM invitations
        WHERE token_hash = $token_hash
        LIMIT 1;
        """,
        {"token_hash": token_hash},
    )

    rows = extract_rows(result)
    return serialize_record_ids(rows[0]) if rows else None


async def list_invitations(
    db: AsyncSurreal,
    organization_id: str,
):
    organization_record = to_record_id(
        "organizations",
        organization_id,
    )

    result = await db.query(
        """
        SELECT *
        FROM invitations
        WHERE organization_id = $organization_id
        ORDER BY created_at DESC;
        """,
        {"organization_id": organization_record},
    )

    return [
        serialize_record_ids(row)
        for row in extract_rows(result)
    ]



async def update_invitation_status(
    db: AsyncSurreal,
    invitation_id: str,
    status: str,
    accepted_at=None,
):
    invitation_record = to_record_id(
        "invitations",
        invitation_id,
    )

    if status == "EXPIRED":
        result = await db.query(
            """
            UPDATE $invitation_id
            SET status = $status
            WHERE status = 'PENDING'
            AND expires_at <= time::now()
            RETURN AFTER;
            """,
            {
                "invitation_id": invitation_record,
                "status": status,
            },
        )

    elif status == "ACCEPTED":
        result = await db.query(
            """
            UPDATE $invitation_id
            SET status = $status,
                accepted_at = $accepted_at
            WHERE status = 'PENDING'
            AND expires_at > time::now()
            RETURN AFTER;
            """,
            {
                "invitation_id": invitation_record,
                "status": status,
                "accepted_at": accepted_at,
            },
        )

    elif status == "REVOKED":
        result = await db.query(
            """
            UPDATE $invitation_id
            SET status = $status
            WHERE status = 'PENDING'
            AND expires_at > time::now()
            RETURN AFTER;
            """,
            {
                "invitation_id": invitation_record,
                "status": status,
            },
        )

    else:
        raise ValueError(f"Unsupported invitation status: {status}")

    rows = extract_rows(result)
    return serialize_record_ids(rows[0]) if rows else None



async def create_user(
    db: AsyncSurreal,
    name: str,
    email: str,
    password_hash: str,
):
    result = await db.query(
        """
        CREATE users CONTENT {
            name: $name,
            email: $email,
            password_hash: $password_hash
        }
        RETURN AFTER;
        """,
        {
            "name": name,
            "email": email,
            "password_hash": password_hash,
        },
    )

    rows = extract_rows(result)
    return rows[0] if rows else None


async def create_membership(
    db: AsyncSurreal,
    user_id: str,
    organization_id: str,
    role: str,
):
    user_record = to_record_id("users", user_id)
    organization_record = to_record_id(
        "organizations",
        organization_id,
    )

    result = await db.query(
        """
        CREATE memberships CONTENT {
            user_id: $user_id,
            organization_id: $organization_id,
            role: $role
        }
        RETURN AFTER;
        """,
        {
            "user_id": user_record,
            "organization_id": organization_record,
            "role": role,
        },
    )

    rows = extract_rows(result)
    return serialize_record_ids(rows[0]) if rows else None


async def create_email_log(
    db: AsyncSurreal,
    organization_id: str,
    recipient: str,
    subject: str,
    status: str,
    invitation_id: str | None = None,
    provider_message_id: str | None = None,
    error_message: str | None = None,
):
    organization_record = to_record_id(
        "organizations",
        organization_id,
    )

    invitation_record = (
        to_record_id("invitations", invitation_id)
        if invitation_id
        else None
    )

    result = await db.query(
        """
        CREATE email_logs CONTENT {
            organization_id: $organization_id,
            invitation_id: $invitation_id,
            recipient: $recipient,
            subject: $subject,
            provider: 'RESEND',
            provider_message_id: $provider_message_id,
            status: $status,
            error_message: $error_message
        }
        RETURN AFTER;
        """,
        {
            "organization_id": organization_record,
            "invitation_id": invitation_record,
            "recipient": recipient,
            "subject": subject,
            "provider_message_id": provider_message_id,
            "status": status,
            "error_message": error_message,
        },
    )

    rows = extract_rows(result)
    return serialize_record_ids(rows[0]) if rows else None

async def accept_invitation_transaction(
    db: AsyncSurreal,
    invitation_id: str,
    organization_id: str,
    user_id: str | None,
    name: str | None = None,
    email: str | None = None,
    password_hash: str | None = None,
    role: str | None = None,
):
    session = None
    txn = None
    committed = False

    try:
        # 1. Create an isolated session.
        session = await db.new_session()

        # 2. Authenticate the new session.
        await session.signin({
            "username": SURREALDB_USERNAME,
            "password": SURREALDB_PASSWORD,
        })

        # 3. Select namespace and database.
        await session.use(
            SURREALDB_NAMESPACE,
            SURREALDB_DATABASE,
        )

        # 4. Start transaction.
        txn = await session.begin_transaction()

        invitation_record = to_record_id(
            "invitations",
            invitation_id,
        )

        organization_record = to_record_id(
            "organizations",
            organization_id,
        )

        # 1. Claim the invitation first.
        # Only one transaction should be able to change PENDING to ACCEPTED.
        result = await txn.query(
            """
            UPDATE $invitation_id
            SET
                status = 'ACCEPTED',
                accepted_at = time::now()
            WHERE status = 'PENDING'
            AND expires_at > time::now()
            RETURN AFTER;
            """,
            {
                "invitation_id": invitation_record,
            },
        )

        accepted_rows = extract_rows(result)

        if not accepted_rows:
            check_result = await txn.query(
                """
                SELECT *
                FROM $invitation_id
                LIMIT 1;
                """,
                {
                    "invitation_id": invitation_record,
                },
            )

            check_rows = extract_rows(check_result)

            if check_rows:
                current_invitation = check_rows[0]

                if (
                    current_invitation.get("status") == "PENDING"
                    and current_invitation.get("expires_at")
                    <= datetime.now(timezone.utc)
                ):
                    raise ValueError("INVITATION_EXPIRED")

            raise ValueError("INVITATION_UNAVAILABLE")

        # 2. Verify organization inside the transaction.
        organization_result = await txn.query(
            """
            SELECT *
            FROM $organization_id
            LIMIT 1;
            """,
            {
                "organization_id": organization_record,
            },
        )

        organizations = extract_rows(organization_result)

        if (
            not organizations
            or not organizations[0].get("is_active", False)
        ):
            raise ValueError("ORGANIZATION_INACTIVE")

        # 3. Get existing user or create a new one.
        if user_id:
            user_record = to_record_id("users", user_id)

            user_result = await txn.query(
                """
                SELECT *
                FROM $user_id
                LIMIT 1;
                """,
                {
                    "user_id": user_record,
                },
            )

            users = extract_rows(user_result)

            if not users:
                raise ValueError("USER_NOT_FOUND")

            user = users[0]

        else:
            existing_result = await txn.query(
                """
                SELECT *
                FROM users
                WHERE email = $email
                LIMIT 1;
                """,
                {
                    "email": email,
                },
            )

            existing_users = extract_rows(existing_result)

            if existing_users:
                raise ValueError("USER_ALREADY_EXISTS")

            create_result = await txn.query(
                """
                CREATE users CONTENT {
                    name: $name,
                    email: $email,
                    password_hash: $password_hash
                }
                RETURN AFTER;
                """,
                {
                    "name": name,
                    "email": email,
                    "password_hash": password_hash,
                },
            )

            created_users = extract_rows(create_result)

            if not created_users:
                raise ValueError("USER_CREATION_FAILED")

            user = created_users[0]

        user = serialize_record_ids(user)

        if not user.get("is_active", True):
            raise ValueError("USER_INACTIVE")

        # 4. Check membership inside the transaction.
        user_record = to_record_id(
            "users",
            user["id"],
        )

        membership_result = await txn.query(
            """
            SELECT *
            FROM memberships
            WHERE user_id = $user_id
            AND organization_id = $organization_id
            LIMIT 1;
            """,
            {
                "user_id": user_record,
                "organization_id": organization_record,
            },
        )

        existing_memberships = extract_rows(membership_result)

        if existing_memberships:
            raise ValueError("ALREADY_MEMBER")

        # 5. Create membership inside the same transaction.
        membership_result = await txn.query(
            """
            CREATE memberships CONTENT {
                user_id: $user_id,
                organization_id: $organization_id,
                role: $role
            }
            RETURN AFTER;
            """,
            {
                "user_id": user_record,
                "organization_id": organization_record,
                "role": role,
            },
        )

        memberships = extract_rows(membership_result)

        if not memberships:
            raise ValueError("MEMBERSHIP_CREATION_FAILED")

        # 6. Commit all changes together.
        await txn.commit()
        committed = True

        return user

    except Exception:
        if txn is not None and not committed:
            try:
                await txn.cancel()
            except Exception:
                pass

        raise

    finally:
        if session is not None:
            try:
                await session.close_session()
            except Exception:
                pass