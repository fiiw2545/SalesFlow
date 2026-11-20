
def test_member_can_access_own_organization(
    organization_isolation_context,
):
    context = organization_isolation_context
    authorization = context["authorization"]

    client = authorization["login_as"]("ADMIN")

    response = client.get(
        f"/organizations/{context['organization_a_id']}"
    )

    assert response.status_code == 200
    assert response.json()["id"] == context["organization_a_id"]
    assert response.json()["name"].startswith("Pytest Organization")


def test_non_member_cannot_access_organization(
    organization_isolation_context,
):
    context = organization_isolation_context
    client = context["client"]

    # Outsider is ADMIN of Organization B,
    # but is not a member of Organization A.
    response = client.get(
        f"/organizations/{context['organization_a_id']}"
    )

    assert response.status_code == 403


def test_nonexistent_organization_returns_404(
    organization_isolation_context,
):
    context = organization_isolation_context
    client = context["client"]

    response = client.get(
        "/organizations/organizations:doesnotexist"
    )

    assert response.status_code == 404


def test_user_sees_only_own_organizations(
    organization_isolation_context,
):
    context = organization_isolation_context
    client = context["client"]

    # Outsider should only see Organization B.
    response = client.get("/organizations/")

    assert response.status_code == 200

    organization_ids = {
        item["id"] for item in response.json()["items"]
    }

    assert organization_ids == {context["organization_b_id"]}
    assert context["organization_a_id"] not in organization_ids


def test_member_cannot_access_other_organization_memberships(
    organization_isolation_context,
):
    context = organization_isolation_context
    client = context["client"]

    # Outsider is ADMIN of Organization B.
    response = client.get(
        "/memberships/",
        headers={
            "X-Organization-ID": context["organization_b_id"],
        },
    )

    assert response.status_code == 200

    memberships = response.json()["items"]
    assert memberships

    # Obtain a real membership ID from Organization B.
    membership_b_id = memberships[0]["id"]

    # Login as ADMIN of Organization A.
    context["authorization"]["login_as"]("ADMIN")

    # Try to access Organization B's membership through Organization A.
    response = client.get(
        f"/memberships/{membership_b_id}",
        headers={
            "X-Organization-ID": context["organization_a_id"],
        },
    )

    assert response.status_code == 404


def test_non_member_cannot_list_organization_memberships(
    organization_isolation_context,
):
    context = organization_isolation_context
    client = context["client"]

    # Outsider is not a member of Organization A.
    response = client.get(
        "/memberships/",
        headers={
            "X-Organization-ID": context["organization_a_id"],
        },
    )

    assert response.status_code == 403
