
import pytest
from uuid import uuid4

from tests.helpers.cleanup import cleanup_test_data


@pytest.fixture
def test_data():
    """
    Track only records created by the current test.
    """
    data = {
        "users": [],
        "organizations": [],
        "companies": [],
        "contacts": [],
        "pipelines": [],
        "stages": [],
        "deals": [],
        "tasks": [],
        "activities": [],
        "notes": [],
    }

    yield data

    cleanup_test_data(data)


@pytest.fixture
def registered_user(client, test_data):
    """
    Register a new user through the API.
    Track the created user for cleanup.
    """
    email = f"pytest-{uuid4().hex}@example.com"

    user_data = {
        "name": "Pytest User",
        "email": email,
        "password": "TestPassword123!",
    }

    response = client.post(
        "/auth/register",
        json=user_data,
    )

    assert response.status_code == 201, response.text

    created_user = response.json()

    test_data["users"].append(created_user["id"])

    return {
        "id": created_user["id"],
        "name": created_user["name"],
        "email": created_user["email"],
        "password": user_data["password"],
    }
    


@pytest.fixture
def authenticated_client(client, registered_user):
    """
    Login the registered test user and provide an
    authenticated TestClient.
    """
    client.cookies.clear()

    try:
        response = client.post(
            "/auth/login",
            json={
                "email": registered_user["email"],
                "password": registered_user["password"],
            },
        )

        assert response.status_code == 200, response.text

        yield client

    finally:
        client.cookies.clear()


@pytest.fixture
def authorization_context(client, test_data):
    """
    Create three users with different roles
    in one test organization.
    """
    from uuid import uuid4

    suffix = uuid4().hex

    users = {}

    # 1. Register three users.
    for role, label in [
        ("ADMIN", "Admin"),
        ("MANAGER", "Manager"),
        ("SALES", "Sales"),
    ]:
        user_data = {
            "name": f"Pytest {label}",
            "email": f"pytest-{label.lower()}-{suffix}@example.com",
            "password": "TestPassword123!",
        }

        response = client.post(
            "/auth/register",
            json=user_data,
        )

        assert response.status_code == 201, response.text

        created_user = response.json()

        test_data["users"].append(created_user["id"])

        users[role] = {
            "id": created_user["id"],
            "name": created_user["name"],
            "email": created_user["email"],
            "password": user_data["password"],
        }

    # 2. Login as ADMIN.
    client.cookies.clear()

    login_response = client.post(
        "/auth/login",
        json={
            "email": users["ADMIN"]["email"],
            "password": users["ADMIN"]["password"],
        },
    )

    assert login_response.status_code == 200, login_response.text

    # 3. Create organization.
    organization_response = client.post(
        "/organizations/",
        json={
            "name": f"Pytest Organization {suffix[:8]}",
            "slug": f"pytest-org-{suffix}",
        },
    )

    assert organization_response.status_code == 201, (
        organization_response.text
    )

    organization_id = organization_response.json()["organization"]["id"]

    test_data["organizations"].append(organization_id)

    # 4. Verify creator receives ADMIN automatically.
    assert organization_response.json()["membership_role"] == "ADMIN"

    # 5. Create MANAGER and SALES memberships.
    for role in ["MANAGER", "SALES"]:
        membership_response = client.post(
            "/memberships/",
            headers={
                "X-Organization-ID": organization_id,
            },
            json={
                "user_id": users[role]["id"],
                "role": role,
            },
        )

        assert membership_response.status_code == 201, (
            membership_response.text
        )

    def login_as(role):
        client.cookies.clear()

        response = client.post(
            "/auth/login",
            json={
                "email": users[role]["email"],
                "password": users[role]["password"],
            },
        )

        assert response.status_code == 200, response.text

        return client

    try:
        yield {
            "client": client,
            "users": users,
            "organization_id": organization_id,
            "login_as": login_as,
        }
    finally:
        client.cookies.clear()



@pytest.fixture
def organization_isolation_context(
    client,
    test_data,
    authorization_context,
):
    from uuid import uuid4

    suffix = uuid4().hex

    # Organization A already exists in authorization_context.
    organization_a_id = authorization_context["organization_id"]

    # 1. Register an outsider.
    outsider_data = {
        "name": "Pytest Outsider",
        "email": f"pytest-outsider-{suffix}@example.com",
        "password": "TestPassword123!",
    }

    register_response = client.post(
        "/auth/register",
        json=outsider_data,
    )

    assert register_response.status_code == 201, register_response.text

    outsider = register_response.json()
    test_data["users"].append(outsider["id"])

    # 2. Login as outsider.
    client.cookies.clear()

    login_response = client.post(
        "/auth/login",
        json={
            "email": outsider_data["email"],
            "password": outsider_data["password"],
        },
    )

    assert login_response.status_code == 200, login_response.text

    # 3. Create Organization B.
    organization_response = client.post(
        "/organizations/",
        json={
            "name": f"Pytest Organization B {suffix[:8]}",
            "slug": f"pytest-org-b-{suffix}",
        },
    )

    assert organization_response.status_code == 201, (
        organization_response.text
    )

    organization_b_id = organization_response.json()["organization"]["id"]
    test_data["organizations"].append(organization_b_id)

    return {
        "client": client,
        "authorization": authorization_context,
        "outsider": {
            **outsider,
            "password": outsider_data["password"],
        },
        "organization_a_id": organization_a_id,
        "organization_b_id": organization_b_id,
    }
