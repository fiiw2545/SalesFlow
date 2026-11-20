
import pytest


@pytest.mark.parametrize(
    "role, endpoint, expected_status",
    [
        # ADMIN
        ("ADMIN", "/auth/admin-only", 200),
        ("ADMIN", "/auth/manager-only", 200),
        ("ADMIN", "/auth/sales-access", 200),

        # MANAGER
        ("MANAGER", "/auth/admin-only", 403),
        ("MANAGER", "/auth/manager-only", 200),
        ("MANAGER", "/auth/sales-access", 200),

        # SALES
        ("SALES", "/auth/admin-only", 403),
        ("SALES", "/auth/manager-only", 403),
        ("SALES", "/auth/sales-access", 200),
    ],
)
def test_role_based_access(
    authorization_context,
    role,
    endpoint,
    expected_status,
):
    client = authorization_context["login_as"](role)

    response = client.get(
        endpoint,
        headers={
            "X-Organization-ID": authorization_context["organization_id"],
        },
    )

    assert response.status_code == expected_status, response.text

    if expected_status == 200:
        assert response.json()["role"] == role


def test_unauthenticated_access_returns_401(authorization_context):
    client = authorization_context["client"]
    client.cookies.clear()

    response = client.get(
        "/auth/admin-only",
        headers={
            "X-Organization-ID": authorization_context["organization_id"],
        },
    )

    assert response.status_code == 401


def test_missing_organization_header_returns_422(authorization_context):
    client = authorization_context["login_as"]("ADMIN")

    response = client.get("/auth/admin-only")

    assert response.status_code == 422
