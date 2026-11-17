
import hashlib
import logging
import secrets

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from surrealdb import AsyncSurreal

from app.security.password import hash_password

from app.modules.auth.service import create_login_tokens

from app.modules.invitations.repository import (
    get_user_by_email,
    get_organization,
    get_membership_by_user_id,
    get_pending_invitation,
    create_invitation as repo_create_invitation,
    get_invitation_by_token_hash,
    list_invitations as repo_list_invitations,
    update_invitation_status,
    create_user,
    create_membership,
    create_email_log,
)

from app.integrations.resend.service import (
    send_email,
    EmailDeliveryError,
)

from app.modules.invitations.repository import (
    accept_invitation_transaction,
)


INVITATION_EXPIRE_DAYS = 7


def generate_invitation_token() -> str:
    return secrets.token_urlsafe(48)


def hash_invitation_token(token: str) -> str:
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


def normalize_email(email: str) -> str:
    return email.strip().lower()

def raise_invitation_status_error(invitation: dict):
    status = invitation.get("status")

    error_mapping = {
        "ACCEPTED": (
            409,
            "Invitation has already been accepted",
        ),
        "REVOKED": (
            409,
            "Invitation has been revoked",
        ),
        "EXPIRED": (
            410,
            "Invitation has expired",
        ),
    }

    status_code, detail = error_mapping.get(
        status,
        (409, "Invitation is no longer available"),
    )

    raise HTTPException(
        status_code=status_code,
        detail=detail,
    )


def get_provider_message_id(response) -> str | None:
    if isinstance(response, dict):
        return response.get("id")

    return getattr(response, "id", None)


async def require_admin(current_membership: dict):
    if current_membership.get("role") != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Only ADMIN can manage invitations",
        )


async def create_invitation(
    db: AsyncSurreal,
    email: str,
    role: str,
    organization_id: str,
    current_user: dict,
    current_membership: dict,
):
    await require_admin(current_membership)

    email = normalize_email(email)

    organization = await get_organization(
        db=db,
        organization_id=organization_id,
    )

    if not organization or not organization.get("is_active", False):
        raise HTTPException(
            status_code=404,
            detail="Organization not found or inactive",
        )

    user = await get_user_by_email(
        db=db,
        email=email,
    )

    if user:
        membership = await get_membership_by_user_id(
            db=db,
            user_id=str(user["id"]),
            organization_id=organization_id,
        )

        if membership:
            raise HTTPException(
                status_code=409,
                detail="User is already a member of this organization",
            )

    pending = await get_pending_invitation(
        db=db,
        email=email,
        organization_id=organization_id,
    )

    if pending:
        raise HTTPException(
            status_code=409,
            detail="A pending invitation already exists for this email",
        )

    token = generate_invitation_token()
    token_hash = hash_invitation_token(token)

    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(days=INVITATION_EXPIRE_DAYS)
    )

    invitation = await repo_create_invitation(
        db=db,
        email=email,
        organization_id=organization_id,
        invited_by=str(current_user["id"]),
        role=role,
        token_hash=token_hash,
        expires_at=expires_at,
    )

    if not invitation:
        raise HTTPException(
            status_code=500,
            detail="Failed to create invitation",
        )

    invitation_id = invitation["id"]
    organization_name = organization["name"]

    # Configure FRONTEND_URL in the environment before production use.
    from app.core.config import FRONTEND_URL

    invitation_url = (
        f"{FRONTEND_URL.rstrip('/')}"
        f"/accept-invitation?token={token}"
    )

    subject = f"Invitation to join {organization_name}"

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>You've been invited to SalesFlow</h2>
        <p>You have been invited to join
        <strong>{organization_name}</strong>.</p>
        <p>Your organization role: <strong>{role}</strong></p>
        <p>This invitation expires in 7 days.</p>
        <a href="{invitation_url}"
           style="display:inline-block;padding:12px 20px;
           background:#2563eb;color:white;text-decoration:none;
           border-radius:6px;">
           Accept Invitation
        </a>
    </div>
    """

    try:
        response = await send_email(
            to=email,
            subject=subject,
            html=html,
            text=(
                f"You have been invited to join {organization_name}. "
                f"Accept your invitation here: {invitation_url}"
            ),
        )

        await create_email_log(
            db=db,
            organization_id=organization_id,
            invitation_id=invitation_id,
            recipient=email,
            subject=subject,
            status="SENT",
            provider_message_id=get_provider_message_id(response),
        )

    except Exception as exc:
        logging.exception("Failed to send invitation email")

        await create_email_log(
            db=db,
            organization_id=organization_id,
            invitation_id=invitation_id,
            recipient=email,
            subject=subject,
            status="FAILED",
            error_message=str(exc)[:1000],
        )

        await update_invitation_status(
            db=db,
            invitation_id=invitation_id,
            status="REVOKED",
        )

        if isinstance(exc, EmailDeliveryError):
            raise HTTPException(
                status_code=502,
                detail="Invitation was created but email delivery failed",
            )

        raise HTTPException(
            status_code=502,
            detail="Invitation email delivery failed",
        )

    return {
        "id": invitation_id,
        "email": email,
        "role": role,
        "status": "PENDING",
        "expires_at": expires_at,
        "message": "Invitation sent successfully",
    }


async def list_invitations(
    db: AsyncSurreal,
    organization_id: str,
    current_membership: dict,
):
    await require_admin(current_membership)

    items = await repo_list_invitations(
        db=db,
        organization_id=organization_id,
    )

    return {
        "items": items,
        "total": len(items),
    }


async def validate_invitation(
    db: AsyncSurreal,
    token: str,
):
    token_hash = hash_invitation_token(token)

    invitation = await get_invitation_by_token_hash(
        db=db,
        token_hash=token_hash,
    )

    if not invitation:
        raise HTTPException(
            status_code=404,
            detail="Invitation not found",
        )

    # Check invitation status.
    if invitation["status"] != "PENDING":
        raise_invitation_status_error(invitation)

    # Check expiration.
    if invitation["expires_at"] <= datetime.now(timezone.utc):
        updated = await update_invitation_status(
            db=db,
            invitation_id=invitation["id"],
            status="EXPIRED",
        )

        if not updated:
            # Reload in case another request changed the status.
            invitation = await get_invitation_by_token_hash(
                db=db,
                token_hash=token_hash,
            )

            if invitation and invitation["status"] != "PENDING":
                raise_invitation_status_error(invitation)

        raise HTTPException(
            status_code=410,
            detail="Invitation has expired",
        )

    organization = await get_organization(
        db=db,
        organization_id=invitation["organization_id"],
    )

    if not organization or not organization.get("is_active", False):
        raise HTTPException(
            status_code=410,
            detail="Organization is no longer active",
        )

    return {
        "email": invitation["email"],
        "organization_name": organization["name"],
        "role": invitation["role"],
        "status": invitation["status"],
        "expires_at": invitation["expires_at"],
        "message": "Invitation is valid",
    }


async def accept_invitation(
    db: AsyncSurreal,
    token: str,
    current_user: dict | None,
    name: str | None = None,
    password: str | None = None,
):
    token_hash = hash_invitation_token(token)

    invitation = await get_invitation_by_token_hash(
        db=db,
        token_hash=token_hash,
    )

    if not invitation:
        raise HTTPException(
            status_code=404,
            detail="Invitation not found",
        )

    if invitation["status"] != "PENDING":
        raise_invitation_status_error(invitation)

    if invitation["expires_at"] <= datetime.now(timezone.utc):
        await update_invitation_status(
            db=db,
            invitation_id=invitation["id"],
            status="EXPIRED",
        )

        raise HTTPException(
            status_code=410,
            detail="Invitation has expired",
        )

    email = normalize_email(invitation["email"])

    # Check logged-in account.
    if current_user:
        current_email = normalize_email(
            current_user["email"]
        )

        if current_email != email:
            raise HTTPException(
                status_code=403,
                detail="Logged-in account does not match invitation email",
            )

        user_id = str(current_user["id"])

        password_hash = None

    else:
        existing_user = await get_user_by_email(
            db=db,
            email=email,
        )

        if existing_user:
            raise HTTPException(
                status_code=401,
                detail="Please login with the invited email before accepting",
            )

        if not name or not password:
            raise HTTPException(
                status_code=422,
                detail="Name and password are required to create an account",
            )

        user_id = None

        password_hash = hash_password(password)

    organization_id = str(invitation["organization_id"])

    # Atomic operation:
    # Invitation + User + Membership.
    try:
        user = await accept_invitation_transaction(
            db=db,
            invitation_id=invitation["id"],
            organization_id=organization_id,
            user_id=user_id,
            name=name.strip() if name else None,
            email=email if user_id is None else None,
            password_hash=password_hash,
            role=invitation["role"],
        )

    except ValueError as exc:
        error_code = str(exc)

        error_mapping = {
            "INVITATION_EXPIRED": (
                410,
                "Invitation has expired",
            ),
            "INVITATION_UNAVAILABLE": (
                409,
                "Invitation is no longer available",
            ),
            "ORGANIZATION_INACTIVE": (
                410,
                "Organization is no longer active",
            ),
            "USER_ALREADY_EXISTS": (
                401,
                "Please login with the invited email before accepting",
            ),
            "USER_NOT_FOUND": (
                404,
                "User not found",
            ),
            "USER_INACTIVE": (
                403,
                "User account is inactive",
            ),
            "ALREADY_MEMBER": (
                409,
                "User is already a member of this organization",
            ),
        }

        status_code, detail = error_mapping.get(
            error_code,
            (500, "Invitation acceptance failed"),
        )

        raise HTTPException(
            status_code=status_code,
            detail=detail,
        )

    except Exception as exc:
        error_text = str(exc).lower()

        logging.exception(
            "Invitation acceptance transaction failed"
        )

        # Unique index violations and transaction write conflicts.
        if any(
            keyword in error_text
            for keyword in (
                "unique",
                "duplicate",
                "write conflict",
                "transaction conflict",
                "already exists",
            )
        ):
            raise HTTPException(
                status_code=409,
                detail="Invitation could not be accepted because of a concurrent request",
            )

        raise HTTPException(
            status_code=500,
            detail="Failed to accept invitation",
        )

    # IMPORTANT:
    # Create login session only after transaction commit.
    try:
        tokens = await create_login_tokens(
            db=db,
            user=user,
        )

    except Exception:
        logging.exception(
            "Invitation accepted but login session creation failed"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Invitation was accepted, but login session "
                "creation failed. Please login again."
            ),
        )

    return {
        "user": user,
        "organization_id": organization_id,
        "role": invitation["role"],
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "message": "Invitation accepted successfully",
    }

async def revoke_invitation(
    db: AsyncSurreal,
    invitation_id: str,
    organization_id: str,
    current_membership: dict,
):
    await require_admin(current_membership)

    invitations = await repo_list_invitations(
        db=db,
        organization_id=organization_id,
    )

    invitation = next(
    (
        item for item in invitations
        if item["id"].split(":", 1)[-1] == invitation_id.split(":", 1)[-1]
    ),
    None,
)

    if not invitation:
        raise HTTPException(
            status_code=404,
            detail="Invitation not found",
        )

    if invitation["status"] != "PENDING":
        raise HTTPException(
            status_code=409,
            detail="Only pending invitations can be revoked",
        )

    revoked = await update_invitation_status(
        db=db,
        invitation_id=invitation_id,
        status="REVOKED",
    )

    if not revoked:
        raise HTTPException(
            status_code=409,
            detail="Invitation could not be revoked",
        )

    return {
        "message": "Invitation revoked successfully",
    }
