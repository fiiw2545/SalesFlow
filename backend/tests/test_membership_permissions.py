
import pytest
from uuid import uuid4


def get_membership_id(client, organization_id, user_id):
    response = client.get(
        "/memberships/",
        headers={"X-Organization-ID": organization_id},
    )
    assert response.status_code == 200, response.text

    memberships = response.json()["items"]

    for membership in memberships:
        if membership["user_id"] == user_id:
            return membership["id"]

    raise AssertionError(f"Membership not found for user: {user_id}")


def register_test_user(client, test_data):
    user_data = {
        "name": "Pytest Member",
        "email": f"pytest-member-{uuid4().hex}@example.com",
        "password": "TestPassword123!",
    }

    response = client.post("/auth/register", json=user_data)
    assert response.status_code == 201, response.text

    user = response.json()
    test_data["users"].append(user["id"])

    return user


def test_admin_can_list_and_get_memberships(authorization_context):
    context = authorization_context
    client = context["login_as"]("ADMIN")
    organization_id = context["organization_id"]

    response = client.get(
        "/memberships/",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200
    assert response.json()["total"] == 3
    assert len(response.json()["items"]) == 3

    admin_id = context["users"]["ADMIN"]["id"]
    membership_id = get_membership_id(
        client,
        organization_id,
        admin_id,
    )

    detail_response = client.get(
        f"/memberships/{membership_id}",
        headers={"X-Organization-ID": organization_id},
    )

    assert detail_response.status_code == 200
    assert detail_response.json()["user_id"] == admin_id
    assert detail_response.json()["role"] == "ADMIN"


def test_admin_can_create_membership(authorization_context, test_data):
    context = authorization_context
    client = context["login_as"]("ADMIN")
    organization_id = context["organization_id"]

    user = register_test_user(client, test_data)

    response = client.post(
        "/memberships/",
        headers={"X-Organization-ID": organization_id},
        json={
            "user_id": user["id"],
            "role": "SALES",
        },
    )

    assert response.status_code == 201
    assert response.json()["user_id"] == user["id"]
    assert response.json()["role"] == "SALES"


def test_admin_can_update_membership_role(authorization_context):
    context = authorization_context
    client = context["login_as"]("ADMIN")
    organization_id = context["organization_id"]

    sales_id = context["users"]["SALES"]["id"]
    membership_id = get_membership_id(
        client,
        organization_id,
        sales_id,
    )

    response = client.patch(
        f"/memberships/{membership_id}",
        headers={"X-Organization-ID": organization_id},
        json={"role": "MANAGER"},
    )

    assert response.status_code == 200
    assert response.json()["role"] == "MANAGER"


def test_admin_cannot_add_duplicate_membership(
    authorization_context,
    test_data,
):
    context = authorization_context
    client = context["login_as"]("ADMIN")
    organization_id = context["organization_id"]

    user = register_test_user(client, test_data)

    payload = {
        "user_id": user["id"],
        "role": "SALES",
    }
    headers = {"X-Organization-ID": organization_id}

    first_response = client.post(
        "/memberships/",
        headers=headers,
        json=payload,
    )
    assert first_response.status_code == 201

    duplicate_response = client.post(
        "/memberships/",
        headers=headers,
        json=payload,
    )

    assert duplicate_response.status_code == 409


def test_admin_cannot_add_nonexistent_user(authorization_context):
    context = authorization_context
    client = context["login_as"]("ADMIN")

    response = client.post(
        "/memberships/",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
        json={
            "user_id": "users:doesnotexist",
            "role": "SALES",
        },
    )

    assert response.status_code == 404


@pytest.mark.parametrize("role", ["MANAGER", "SALES"])
def test_non_admin_cannot_create_membership(
    authorization_context,
    role,
):
    context = authorization_context
    client = context["login_as"](role)

    response = client.post(
        "/memberships/",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
        json={
            "user_id": context["users"]["ADMIN"]["id"],
            "role": "SALES",
        },
    )

    assert response.status_code == 403


@pytest.mark.parametrize("role", ["MANAGER", "SALES"])
def test_non_admin_cannot_update_membership(
    authorization_context,
    role,
):
    context = authorization_context
    client = context["login_as"](role)
    organization_id = context["organization_id"]

    sales_id = context["users"]["SALES"]["id"]
    membership_id = get_membership_id(
        client,
        organization_id,
        sales_id,
    )

    response = client.patch(
        f"/memberships/{membership_id}",
        headers={"X-Organization-ID": organization_id},
        json={"role": "MANAGER"},
    )

    assert response.status_code == 403


@pytest.mark.parametrize("role", ["MANAGER", "SALES"])
def test_non_admin_cannot_delete_membership(
    authorization_context,
    role,
):
    context = authorization_context
    client = context["login_as"](role)
    organization_id = context["organization_id"]

    sales_id = context["users"]["SALES"]["id"]
    membership_id = get_membership_id(
        client,
        organization_id,
        sales_id,
    )

    response = client.delete(
        f"/memberships/{membership_id}",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 403


def test_admin_cannot_demote_last_admin(authorization_context):
    context = authorization_context
    client = context["login_as"]("ADMIN")
    organization_id = context["organization_id"]

    admin_id = context["users"]["ADMIN"]["id"]
    membership_id = get_membership_id(
        client,
        organization_id,
        admin_id,
    )

    response = client.patch(
        f"/memberships/{membership_id}",
        headers={"X-Organization-ID": organization_id},
        json={"role": "MANAGER"},
    )

    assert response.status_code == 409


def test_admin_cannot_delete_last_admin(authorization_context):
    context = authorization_context
    client = context["login_as"]("ADMIN")
    organization_id = context["organization_id"]

    admin_id = context["users"]["ADMIN"]["id"]
    membership_id = get_membership_id(
        client,
        organization_id,
        admin_id,
    )

    response = client.delete(
        f"/memberships/{membership_id}",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 409
