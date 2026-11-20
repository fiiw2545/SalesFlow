
from uuid import uuid4

import pytest


def extract_rows(value):
    """Extract rows from direct or wrapped SurrealDB query results."""
    if isinstance(value, dict):
        if "id" in value:
            return [value]

        if "result" in value:
            return extract_rows(value["result"])

        if "data" in value:
            return extract_rows(value["data"])

        return []

    if isinstance(value, list):
        if not value:
            return []

        if all(isinstance(item, dict) and "id" in item for item in value):
            return value

        rows = []
        for item in value:
            rows.extend(extract_rows(item))
        return rows

    return []

def normalize_record_id(record_id, table):
    if isinstance(record_id, dict):
        record_id = record_id.get("id")

    record_id = str(record_id)

    if record_id.startswith(f"{table}:"):
        return record_id

    return f"{table}:{record_id}"

def create_company(client, organization_id, test_data):
    response = client.post(
        "/companies/",
        headers={"X-Organization-ID": organization_id},
        json={"name": f"Contact Test Company {uuid4().hex[:8]}"},
    )

    assert response.status_code == 201, response.text

    company_id = response.json()["id"]
    test_data["companies"].append(company_id)
    return company_id


def create_contact(
    client,
    organization_id,
    test_data,
    company_id=None,
    **overrides,
):
    payload = {
        "name": f"Pytest Contact {uuid4().hex[:8]}",
        "email": f"contact-{uuid4().hex}@example.com",
        "phone": "0812345678",
        "age": 25,
        "company_id": company_id,
        "position": "Software Developer",
    }
    payload.update(overrides)

    response = client.post(
        "/contacts/",
        headers={"X-Organization-ID": organization_id},
        json=payload,
    )

    if response.status_code == 201:
        rows = extract_rows(response.json().get("data"))
        assert rows, response.json()
        test_data["contacts"].append(
            normalize_record_id(rows[0]["id"], "contacts")
        )

    return response


@pytest.fixture
def contact_context(client, authorization_context, test_data):
    authorization_context["login_as"]("ADMIN")

    organization_id = authorization_context["organization_id"]
    company_id = create_company(client, organization_id, test_data)

    return {
        "client": client,
        "organization_id": organization_id,
        "company_id": company_id,
        "test_data": test_data,
        "authorization": authorization_context,
    }


# --------------------------------------------------
# CREATE
# --------------------------------------------------

def test_create_contact_success(contact_context):
    response = create_contact(
        contact_context["client"],
        contact_context["organization_id"],
        contact_context["test_data"],
        contact_context["company_id"],
    )

    assert response.status_code == 201
    assert response.json()["message"] == "Contact created successfully"

    rows = extract_rows(response.json()["data"])
    assert rows
    assert rows[0]["name"].startswith("Pytest Contact")


def test_create_contact_without_company(contact_context):
    response = create_contact(
        contact_context["client"],
        contact_context["organization_id"],
        contact_context["test_data"],
    )

    assert response.status_code == 201


# --------------------------------------------------
# VALIDATION
# --------------------------------------------------

@pytest.mark.parametrize(
    "payload",
    [
        {"name": "A"},
        {"email": "invalid-email"},
        {"phone": "12345"},
        {"age": 121},
        {"age": -1},
        {"unknown_field": "not allowed"},
    ],
)
def test_create_contact_validation_error(contact_context, payload):
    response = create_contact(
        contact_context["client"],
        contact_context["organization_id"],
        contact_context["test_data"],
        **payload,
    )

    assert response.status_code == 422


# --------------------------------------------------
# COMPANY RELATIONSHIP
# --------------------------------------------------

def test_create_contact_with_invalid_company_format(contact_context):
    response = create_contact(
        contact_context["client"],
        contact_context["organization_id"],
        contact_context["test_data"],
        company_id="invalid-company-id",
    )

    assert response.status_code == 404


def test_create_contact_with_nonexistent_company(contact_context):
    response = create_contact(
        contact_context["client"],
        contact_context["organization_id"],
        contact_context["test_data"],
        company_id="companies:nonexistent123",
    )

    assert response.status_code == 404


def test_create_contact_with_company_from_another_organization(
    client,
    organization_isolation_context,
    test_data,
):
    context = organization_isolation_context
    organization_a_id = context["organization_a_id"]
    organization_b_id = context["organization_b_id"]

    # Create Company B while logged in as Organization B admin.
    company_b_id = create_company(client, organization_b_id, test_data)

    # Switch back to Organization A admin.
    context["authorization"]["login_as"]("ADMIN")

    response = create_contact(
        client,
        organization_a_id,
        test_data,
        company_id=company_b_id,
    )

    assert response.status_code == 404


# --------------------------------------------------
# LIST & SEARCH
# --------------------------------------------------

def test_list_contacts(contact_context):
    client = contact_context["client"]
    organization_id = contact_context["organization_id"]
    test_data = contact_context["test_data"]

    create_contact(
        client,
        organization_id,
        test_data,
        contact_context["company_id"],
    )

    response = client.get(
        "/contacts/",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200

    body = response.json()
    assert body["message"] == "Contacts retrieved successfully"
    assert body["total"] >= 1
    assert body["page"] == 1
    assert body["limit"] == 10
    assert body["total_pages"] >= 1


def test_search_contacts(contact_context):
    client = contact_context["client"]
    organization_id = contact_context["organization_id"]
    test_data = contact_context["test_data"]

    unique_name = f"UniqueSearch{uuid4().hex[:8]}"

    create_contact(
        client,
        organization_id,
        test_data,
        name=unique_name,
    )

    response = client.get(
        "/contacts/",
        params={"search": unique_name.lower()},
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200
    assert response.json()["total"] >= 1


def test_list_contacts_pagination(contact_context):
    client = contact_context["client"]
    organization_id = contact_context["organization_id"]
    test_data = contact_context["test_data"]

    for _ in range(3):
        create_contact(
            client,
            organization_id,
            test_data,
            contact_context["company_id"],
        )

    response = client.get(
        "/contacts/",
        params={"page": 1, "limit": 2},
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200
    assert response.json()["page"] == 1
    assert response.json()["limit"] == 2


def test_list_contacts_invalid_pagination(contact_context):
    response = contact_context["client"].get(
        "/contacts/",
        params={"page": 0},
        headers={
            "X-Organization-ID": contact_context["organization_id"]
        },
    )

    assert response.status_code == 422


# --------------------------------------------------
# GET
# --------------------------------------------------

def test_get_contact_success(contact_context):
    client = contact_context["client"]
    organization_id = contact_context["organization_id"]

    create_response = create_contact(
        client,
        organization_id,
        contact_context["test_data"],
        contact_context["company_id"],
    )

    rows = extract_rows(create_response.json()["data"])
    contact_id = normalize_record_id(rows[0]["id"], "contacts")

    print("CONTACT ID:", contact_id)
    print("CREATE RESPONSE:", create_response.json()["data"])

    response = client.get(
        f"/contacts/{contact_id}",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Contact retrieved successfully"


def test_get_nonexistent_contact_returns_404(contact_context):
    response = contact_context["client"].get(
        "/contacts/contacts:nonexistent123",
        headers={
            "X-Organization-ID": contact_context["organization_id"]
        },
    )

    assert response.status_code == 404


# --------------------------------------------------
# UPDATE
# --------------------------------------------------

def test_update_contact_success(contact_context):
    client = contact_context["client"]
    organization_id = contact_context["organization_id"]
    test_data = contact_context["test_data"]

    create_response = create_contact(
        client,
        organization_id,
        test_data,
        contact_context["company_id"],
    )

    rows = extract_rows(create_response.json()["data"])
    contact_id = normalize_record_id(rows[0]["id"], "contacts")

    response = client.put(
        f"/contacts/{contact_id}",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": "Updated Pytest Contact",
            "email": f"updated-{uuid4().hex}@example.com",
            "phone": "0898765432",
            "age": 30,
            "company_id": contact_context["company_id"],
            "position": "Backend Developer",
        },
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Contact updated successfully"


def test_update_contact_remove_company(contact_context):
    client = contact_context["client"]
    organization_id = contact_context["organization_id"]

    create_response = create_contact(
        client,
        organization_id,
        contact_context["test_data"],
        contact_context["company_id"],
    )

    rows = extract_rows(create_response.json()["data"])
    contact_id = normalize_record_id(rows[0]["id"], "contacts")

    response = client.put(
        f"/contacts/{contact_id}",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": "Contact Without Company",
            "email": f"no-company-{uuid4().hex}@example.com",
            "phone": "0812345678",
            "age": 26,
            "company_id": None,
            "position": None,
        },
    )

    assert response.status_code == 200


def test_update_contact_with_invalid_company_returns_404(contact_context):
    client = contact_context["client"]
    organization_id = contact_context["organization_id"]

    create_response = create_contact(
        client,
        organization_id,
        contact_context["test_data"],
    )

    rows = extract_rows(create_response.json()["data"])
    contact_id = normalize_record_id(rows[0]["id"], "contacts")

    response = client.put(
        f"/contacts/{contact_id}",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": "Invalid Company Contact",
            "email": f"invalid-company-{uuid4().hex}@example.com",
            "phone": "0812345678",
            "age": 25,
            "company_id": "companies:nonexistent123",
            "position": None,
        },
    )

    assert response.status_code == 404


def test_update_nonexistent_contact_returns_404(contact_context):
    response = contact_context["client"].put(
        "/contacts/contacts:nonexistent123",
        headers={
            "X-Organization-ID": contact_context["organization_id"]
        },
        json={
            "name": "Updated Contact",
            "email": f"update-{uuid4().hex}@example.com",
            "phone": "0812345678",
            "age": 25,
            "company_id": None,
            "position": None,
        },
    )

    assert response.status_code == 404


# --------------------------------------------------
# DELETE
# --------------------------------------------------

def test_delete_contact_success(contact_context):
    client = contact_context["client"]
    organization_id = contact_context["organization_id"]

    create_response = create_contact(
        client,
        organization_id,
        contact_context["test_data"],
        contact_context["company_id"],
    )

    rows = extract_rows(create_response.json()["data"])
    contact_id = normalize_record_id(rows[0]["id"], "contacts")

    response = client.delete(
        f"/contacts/{contact_id}",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 204
    assert response.content == b""


def test_delete_nonexistent_contact_returns_404(contact_context):
    response = contact_context["client"].delete(
        "/contacts/contacts:nonexistent123",
        headers={
            "X-Organization-ID": contact_context["organization_id"]
        },
    )

    assert response.status_code == 404


# --------------------------------------------------
# ORGANIZATION ISOLATION
# --------------------------------------------------

def test_contact_is_isolated_between_organizations(
    client,
    organization_isolation_context,
    test_data,
):
    context = organization_isolation_context
    organization_a_id = context["organization_a_id"]
    organization_b_id = context["organization_b_id"]

    context["authorization"]["login_as"]("ADMIN")

    contact_response = create_contact(
        client,
        organization_a_id,
        test_data,
    )

    assert contact_response.status_code == 201

    rows = extract_rows(contact_response.json()["data"])
    contact_id = normalize_record_id(rows[0]["id"], "contacts")

    # Switch to Organization B admin.
    client.cookies.clear()
    outsider = context["outsider"]

    login_response = client.post(
        "/auth/login",
        json={
            "email": outsider["email"],
            "password": outsider["password"],
        },
    )
    assert login_response.status_code == 200

    response = client.get(
        f"/contacts/{contact_id}",
        headers={"X-Organization-ID": organization_b_id},
    )

    assert response.status_code == 404
