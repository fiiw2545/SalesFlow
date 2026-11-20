
import pytest
from uuid import uuid4


def create_test_organization(client, test_data):
    suffix = uuid4().hex

    response = client.post(
        "/organizations/",
        json={
            "name": f"Pytest Organization {suffix[:8]}",
            "slug": f"pytest-org-{suffix}",
        },
    )

    assert response.status_code == 201, response.text

    organization = response.json()["organization"]
    test_data["organizations"].append(organization["id"])

    return organization


def test_admin_can_create_organization(authorization_context, test_data):
    context = authorization_context
    client = context["login_as"]("ADMIN")

    organization = create_test_organization(client, test_data)

    assert organization["name"].startswith("Pytest Organization")
    assert organization["is_active"] is True


def test_organization_creator_receives_admin_membership(
    authorization_context,
    test_data,
):
    context = authorization_context
    client = context["login_as"]("ADMIN")

    organization = create_test_organization(client, test_data)

    response = client.get(
        "/organizations/",
    )

    assert response.status_code == 200

    memberships = response.json()["items"]
    created_item = next(
        item for item in memberships
        if item["id"] == organization["id"]
    )

    assert created_item["role"] == "ADMIN"


def test_admin_can_list_own_organizations(authorization_context):
    context = authorization_context
    client = context["login_as"]("ADMIN")

    response = client.get("/organizations/")

    assert response.status_code == 200
    assert response.json()["total"] >= 1

    organization_ids = [
        item["id"] for item in response.json()["items"]
    ]

    assert context["organization_id"] in organization_ids


def test_admin_can_update_organization(
    authorization_context,
):
    context = authorization_context
    client = context["login_as"]("ADMIN")
    organization_id = context["organization_id"]

    new_name = f"Updated Organization {uuid4().hex[:8]}"

    response = client.put(
        f"/organizations/{organization_id}",
        json={"name": new_name},
    )

    assert response.status_code == 200
    assert response.json()["id"] == organization_id
    assert response.json()["name"] == new_name


@pytest.mark.parametrize("role", ["MANAGER", "SALES"])
def test_non_admin_cannot_update_organization(
    authorization_context,
    role,
):
    context = authorization_context
    client = context["login_as"](role)

    response = client.put(
        f"/organizations/{context['organization_id']}",
        json={"name": "Unauthorized Update"},
    )

    assert response.status_code == 403


def test_admin_cannot_update_with_empty_data(authorization_context):
    context = authorization_context
    client = context["login_as"]("ADMIN")

    response = client.put(
        f"/organizations/{context['organization_id']}",
        json={},
    )

    assert response.status_code == 422


def test_admin_cannot_update_with_null_values(authorization_context):
    context = authorization_context
    client = context["login_as"]("ADMIN")

    response = client.put(
        f"/organizations/{context['organization_id']}",
        json={"name": None},
    )

    assert response.status_code == 422


def test_admin_can_deactivate_organization(
    authorization_context,
    test_data,
):
    context = authorization_context
    client = context["login_as"]("ADMIN")

    organization = create_test_organization(client, test_data)
    organization_id = organization["id"]

    response = client.delete(
        f"/organizations/{organization_id}",
    )

    assert response.status_code == 200
    assert response.json()["message"] == (
        "Organization deactivated successfully"
    )

    list_response = client.get("/organizations/")

    assert list_response.status_code == 200

    active_organization_ids = [
        item["id"] for item in list_response.json()["items"]
    ]

    assert organization_id not in active_organization_ids


@pytest.mark.parametrize("role", ["MANAGER", "SALES"])
def test_non_admin_cannot_deactivate_organization(
    authorization_context,
    role,
):
    context = authorization_context
    client = context["login_as"](role)

    response = client.delete(
        f"/organizations/{context['organization_id']}",
    )

    assert response.status_code == 403


def test_admin_cannot_deactivate_already_inactive_organization(
    authorization_context,
    test_data,
):
    context = authorization_context
    client = context["login_as"]("ADMIN")

    organization = create_test_organization(client, test_data)
    organization_id = organization["id"]

    first_response = client.delete(
        f"/organizations/{organization_id}",
    )
    assert first_response.status_code == 200

    second_response = client.delete(
        f"/organizations/{organization_id}",
    )

    assert second_response.status_code == 422
