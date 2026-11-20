
from uuid import uuid4


def create_test_company(client, test_data, organization_id, name=None):
    company_name = name or f"Pytest Company {uuid4().hex[:8]}"

    response = client.post(
        "/companies/",
        headers={"X-Organization-ID": organization_id},
        json={"name": company_name},
    )

    assert response.status_code == 201, response.text

    company = response.json()
    test_data["companies"].append(company["id"])

    return company


def test_create_company_success(authorization_context, test_data):
    context = authorization_context
    client = context["login_as"]("ADMIN")
    organization_id = context["organization_id"]

    company = create_test_company(
        client,
        test_data,
        organization_id,
    )

    assert company["name"].startswith("Pytest Company")
    assert company["organization_id"] == organization_id
    assert company["created_by"] == context["users"]["ADMIN"]["id"]


def test_create_company_trims_name(authorization_context, test_data):
    context = authorization_context
    client = context["login_as"]("ADMIN")

    response = client.post(
        "/companies/",
        headers={"X-Organization-ID": context["organization_id"]},
        json={"name": "  Trimmed Company  "},
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Trimmed Company"

    test_data["companies"].append(response.json()["id"])


def test_create_company_rejects_blank_name(authorization_context):
    context = authorization_context
    client = context["login_as"]("ADMIN")

    response = client.post(
        "/companies/",
        headers={"X-Organization-ID": context["organization_id"]},
        json={"name": "   "},
    )

    assert response.status_code == 422


def test_create_company_rejects_duplicate_name(
    authorization_context,
    test_data,
):
    context = authorization_context
    client = context["login_as"]("ADMIN")
    organization_id = context["organization_id"]

    create_test_company(
        client,
        test_data,
        organization_id,
        name="Duplicate Company",
    )

    response = client.post(
        "/companies/",
        headers={"X-Organization-ID": organization_id},
        json={"name": "Duplicate Company"},
    )

    assert response.status_code == 409


def test_list_companies(authorization_context, test_data):
    context = authorization_context
    client = context["login_as"]("ADMIN")
    organization_id = context["organization_id"]

    create_test_company(client, test_data, organization_id)
    create_test_company(client, test_data, organization_id)

    response = client.get(
        "/companies/",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200
    assert response.json()["total"] == 2
    assert len(response.json()["items"]) == 2
    assert response.json()["page"] == 1


def test_search_companies(authorization_context, test_data):
    context = authorization_context
    client = context["login_as"]("ADMIN")
    organization_id = context["organization_id"]

    create_test_company(
        client,
        test_data,
        organization_id,
        name="Searchable Company Alpha",
    )
    create_test_company(
        client,
        test_data,
        organization_id,
        name="Another Business",
    )

    response = client.get(
        "/companies/?search=%20ALPHA%20",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["name"] == (
        "Searchable Company Alpha"
    )


def test_get_company_success(authorization_context, test_data):
    context = authorization_context
    client = context["login_as"]("ADMIN")
    organization_id = context["organization_id"]

    company = create_test_company(
        client,
        test_data,
        organization_id,
    )

    response = client.get(
        f"/companies/{company['id']}",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200
    assert response.json()["id"] == company["id"]


def test_update_company_success(authorization_context, test_data):
    context = authorization_context
    client = context["login_as"]("ADMIN")
    organization_id = context["organization_id"]

    company = create_test_company(
        client,
        test_data,
        organization_id,
    )

    response = client.patch(
        f"/companies/{company['id']}",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": "Updated Company",
            "industry": "Technology",
            "phone": "0812345678",
        },
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Updated Company"
    assert response.json()["industry"] == "Technology"
    assert response.json()["phone"] == "0812345678"


def test_update_company_with_empty_payload_returns_existing(
    authorization_context,
    test_data,
):
    context = authorization_context
    client = context["login_as"]("ADMIN")
    organization_id = context["organization_id"]

    company = create_test_company(
        client,
        test_data,
        organization_id,
    )

    response = client.patch(
        f"/companies/{company['id']}",
        headers={"X-Organization-ID": organization_id},
        json={},
    )

    assert response.status_code == 200
    assert response.json()["id"] == company["id"]
    assert response.json()["name"] == company["name"]


def test_update_company_rejects_blank_name(
    authorization_context,
    test_data,
):
    context = authorization_context
    client = context["login_as"]("ADMIN")
    organization_id = context["organization_id"]

    company = create_test_company(
        client,
        test_data,
        organization_id,
    )

    response = client.patch(
        f"/companies/{company['id']}",
        headers={"X-Organization-ID": organization_id},
        json={"name": "   "},
    )

    assert response.status_code == 422


def test_update_company_rejects_duplicate_name(
    authorization_context,
    test_data,
):
    context = authorization_context
    client = context["login_as"]("ADMIN")
    organization_id = context["organization_id"]

    create_test_company(
        client,
        test_data,
        organization_id,
        name="Existing Company",
    )

    company = create_test_company(
        client,
        test_data,
        organization_id,
        name="Another Company",
    )

    response = client.patch(
        f"/companies/{company['id']}",
        headers={"X-Organization-ID": organization_id},
        json={"name": "Existing Company"},
    )

    assert response.status_code == 409


def test_delete_company_success(authorization_context, test_data):
    context = authorization_context
    client = context["login_as"]("ADMIN")
    organization_id = context["organization_id"]

    company = create_test_company(
        client,
        test_data,
        organization_id,
    )

    response = client.delete(
        f"/companies/{company['id']}",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Company deleted successfully"

    get_response = client.get(
        f"/companies/{company['id']}",
        headers={"X-Organization-ID": organization_id},
    )

    assert get_response.status_code == 404


def test_nonexistent_company_returns_404(authorization_context):
    context = authorization_context
    client = context["login_as"]("ADMIN")

    response = client.get(
        "/companies/companies:doesnotexist",
        headers={"X-Organization-ID": context["organization_id"]},
    )

    assert response.status_code == 404


def test_company_is_isolated_between_organizations(
    organization_isolation_context,
    test_data,
):
    context = organization_isolation_context
    client = context["client"]

    # Create Company in Organization A as its ADMIN.
    admin = context["authorization"]["login_as"]("ADMIN")

    company = create_test_company(
        admin,
        test_data,
        context["organization_a_id"],
    )

    # Login as outsider, who belongs only to Organization B.
    client.cookies.clear()

    login_response = client.post(
        "/auth/login",
        json={
            "email": context["outsider"]["email"],
            "password": "TestPassword123!",
        },
    )
    assert login_response.status_code == 200

    headers = {
        "X-Organization-ID": context["organization_b_id"],
    }

    response = client.get(
        f"/companies/{company['id']}",
        headers=headers,
    )

    assert response.status_code == 404

    list_response = client.get(
        "/companies/",
        headers=headers,
    )

    assert list_response.status_code == 200
    assert all(
        item["id"] != company["id"]
        for item in list_response.json()["items"]
    )
