
def test_authorization_context_fixture(authorization_context):
    users = authorization_context["users"]
    organization_id = authorization_context["organization_id"]

    assert users["ADMIN"]["id"]
    assert users["MANAGER"]["id"]
    assert users["SALES"]["id"]

    assert organization_id

    # Verify ADMIN access.
    client = authorization_context["login_as"]("ADMIN")

    response = client.get(
        "/auth/admin-only",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200
    assert response.json()["role"] == "ADMIN"

    # Verify MANAGER access.
    client = authorization_context["login_as"]("MANAGER")

    response = client.get(
        "/auth/manager-only",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200
    assert response.json()["role"] == "MANAGER"

    # Verify SALES access.
    client = authorization_context["login_as"]("SALES")

    response = client.get(
        "/auth/sales-access",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200
    assert response.json()["role"] == "SALES"
