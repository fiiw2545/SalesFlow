
from uuid import uuid4

import pytest


# --------------------------------------------------
# HELPERS
# --------------------------------------------------

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


def create_pipeline(client, organization_id, test_data):
    response = client.post(
        "/pipelines/",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": f"Deal Test Pipeline {uuid4().hex[:8]}",
            "description": "Pipeline for Deals tests",
            "is_default": False,
        },
    )

    assert response.status_code == 201, response.text

    pipeline = response.json()
    test_data["pipelines"].append(pipeline["id"])

    return pipeline


def create_stage(client, organization_id, pipeline_id, test_data):
    response = client.post(
        f"/pipelines/{pipeline_id}/stages/",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": f"Deal Test Stage {uuid4().hex[:8]}",
            "position": 1,
            "probability": 30,
        },
    )

    assert response.status_code == 201, response.text

    stage = response.json()
    test_data["stages"].append(stage["id"])

    return stage


def create_company(client, organization_id, test_data):
    response = client.post(
        "/companies/",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": f"Deal Test Company {uuid4().hex[:8]}",
        },
    )

    assert response.status_code == 201, response.text

    company = response.json()
    test_data["companies"].append(company["id"])

    return company


def create_contact(
    client,
    organization_id,
    test_data,
    company_id=None,
):
    response = client.post(
        "/contacts/",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": f"Deal Test Contact {uuid4().hex[:8]}",
            "email": f"deal-contact-{uuid4().hex}@example.com",
            "phone": "0812345678",
            "age": 25,
            "company_id": company_id,
            "position": "Software Developer",
        },
    )

    assert response.status_code == 201, response.text

    rows = extract_rows(response.json().get("data"))
    assert rows, response.json()

    contact_id = normalize_record_id(rows[0]["id"], "contacts")
    test_data["contacts"].append(contact_id)

    return contact_id


def create_deal(
    client,
    organization_id,
    stage_id,
    test_data,
    company_id=None,
    contact_id=None,
    **overrides,
):
    payload = {
        "title": f"Pytest Deal {uuid4().hex[:8]}",
        "value": 10000,
        "currency": "THB",
        "stage_id": stage_id,
        "company_id": company_id,
        "contact_id": contact_id,
    }

    payload.update(overrides)

    response = client.post(
        "/deals/",
        headers={"X-Organization-ID": organization_id},
        json=payload,
    )

    if response.status_code == 201:
        test_data["deals"].append(response.json()["id"])

    return response


@pytest.fixture
def deal_context(client, authorization_context, test_data):
    context = authorization_context
    context["login_as"]("ADMIN")

    organization_id = context["organization_id"]

    pipeline = create_pipeline(
        client,
        organization_id,
        test_data,
    )

    stage = create_stage(
        client,
        organization_id,
        pipeline["id"],
        test_data,
    )

    return {
        "client": client,
        "organization_id": organization_id,
        "pipeline": pipeline,
        "stage": stage,
        "test_data": test_data,
        "authorization": context,
    }


# --------------------------------------------------
# CREATE
# --------------------------------------------------

def test_create_deal_success(deal_context):
    context = deal_context

    response = create_deal(
        context["client"],
        context["organization_id"],
        context["stage"]["id"],
        context["test_data"],
    )

    assert response.status_code == 201, response.text

    body = response.json()

    assert body["title"].startswith("Pytest Deal")
    assert body["currency"] == "THB"
    assert body["stage_id"] == context["stage"]["id"]
    assert body["organization_id"] == context["organization_id"]
    assert body["status"] == "OPEN"


def test_create_deal_with_company_and_contact(deal_context):
    context = deal_context
    client = context["client"]
    organization_id = context["organization_id"]
    test_data = context["test_data"]

    company = create_company(client, organization_id, test_data)
    contact_id = create_contact(
        client,
        organization_id,
        test_data,
        company["id"],
    )

    response = create_deal(
        client,
        organization_id,
        context["stage"]["id"],
        test_data,
        company_id=company["id"],
        contact_id=contact_id,
    )

    assert response.status_code == 201, response.text
    assert response.json()["company_id"] == company["id"]
    assert response.json()["contact_id"] == contact_id


def test_create_deal_with_company_only(deal_context):
    context = deal_context

    company = create_company(
        context["client"],
        context["organization_id"],
        context["test_data"],
    )

    response = create_deal(
        context["client"],
        context["organization_id"],
        context["stage"]["id"],
        context["test_data"],
        company_id=company["id"],
    )

    assert response.status_code == 201, response.text
    assert response.json()["company_id"] == company["id"]
    assert response.json()["contact_id"] is None


def test_create_deal_with_contact_only(deal_context):
    context = deal_context

    contact_id = create_contact(
        context["client"],
        context["organization_id"],
        context["test_data"],
    )

    response = create_deal(
        context["client"],
        context["organization_id"],
        context["stage"]["id"],
        context["test_data"],
        contact_id=contact_id,
    )

    assert response.status_code == 201, response.text
    assert response.json()["contact_id"] == contact_id
    assert response.json()["company_id"] is None


# --------------------------------------------------
# VALIDATION
# --------------------------------------------------

@pytest.mark.parametrize(
    "payload",
    [
        {"title": "A"},
        {"title": ""},
        {"value": -1},
        {"currency": "TH"},
        {"currency": "THAI"},
        {"unknown_field": "not allowed"},
    ],
)
def test_create_deal_validation_error(deal_context, payload):
    context = deal_context

    base_payload = {
        "title": "Valid Deal",
        "value": 1000,
        "currency": "THB",
        "stage_id": context["stage"]["id"],
    }

    base_payload.update(payload)

    response = context["client"].post(
        "/deals/",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
        json=base_payload,
    )

    assert response.status_code == 422


def test_create_deal_with_nonexistent_stage_returns_404(deal_context):
    context = deal_context

    response = create_deal(
        context["client"],
        context["organization_id"],
        "stages:nonexistent123",
        context["test_data"],
    )

    assert response.status_code == 404


def test_create_deal_with_company_from_another_organization(
    client,
    organization_isolation_context,
    test_data,
):
    context = organization_isolation_context
    organization_a_id = context["organization_a_id"]
    organization_b_id = context["organization_b_id"]

    # Create a Company in Organization B.
    outsider = context["outsider"]

    client.cookies.clear()
    login_response = client.post(
        "/auth/login",
        json={
            "email": outsider["email"],
            "password": outsider["password"],
        },
    )
    assert login_response.status_code == 200

    company_b = create_company(
        client,
        organization_b_id,
        test_data,
    )

    # Switch to Organization A ADMIN.
    context["authorization"]["login_as"]("ADMIN")

    pipeline = create_pipeline(client, organization_a_id, test_data)
    stage = create_stage(
        client,
        organization_a_id,
        pipeline["id"],
        test_data,
    )

    response = create_deal(
        client,
        organization_a_id,
        stage["id"],
        test_data,
        company_id=company_b["id"],
    )

    assert response.status_code == 404


def test_create_deal_with_contact_from_another_organization(
    client,
    organization_isolation_context,
    test_data,
):
    context = organization_isolation_context
    organization_a_id = context["organization_a_id"]
    organization_b_id = context["organization_b_id"]

    # Create a Contact in Organization B.
    outsider = context["outsider"]

    client.cookies.clear()
    login_response = client.post(
        "/auth/login",
        json={
            "email": outsider["email"],
            "password": outsider["password"],
        },
    )
    assert login_response.status_code == 200

    contact_id = create_contact(
        client,
        organization_b_id,
        test_data,
    )

    # Switch to Organization A ADMIN.
    context["authorization"]["login_as"]("ADMIN")

    pipeline = create_pipeline(client, organization_a_id, test_data)
    stage = create_stage(
        client,
        organization_a_id,
        pipeline["id"],
        test_data,
    )

    response = create_deal(
        client,
        organization_a_id,
        stage["id"],
        test_data,
        contact_id=contact_id,
    )

    assert response.status_code == 404


def test_create_deal_rejects_contact_from_different_company(deal_context):
    context = deal_context
    client = context["client"]
    organization_id = context["organization_id"]
    test_data = context["test_data"]

    company_a = create_company(client, organization_id, test_data)
    company_b = create_company(client, organization_id, test_data)

    contact_id = create_contact(
        client,
        organization_id,
        test_data,
        company_b["id"],
    )

    response = create_deal(
        client,
        organization_id,
        context["stage"]["id"],
        test_data,
        company_id=company_a["id"],
        contact_id=contact_id,
    )

    assert response.status_code == 404


# --------------------------------------------------
# LIST & SEARCH
# --------------------------------------------------

def test_list_deals(deal_context):
    context = deal_context

    for _ in range(2):
        response = create_deal(
            context["client"],
            context["organization_id"],
            context["stage"]["id"],
            context["test_data"],
        )
        assert response.status_code == 201, response.text

    response = context["client"].get(
        "/deals/",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert response.status_code == 200, response.text

    body = response.json()
    assert body["total"] == 2
    assert len(body["items"]) == 2
    assert body["page"] == 1
    assert body["limit"] == 10


def test_search_deals(deal_context):
    context = deal_context
    unique_title = f"UniqueDeal{uuid4().hex[:8]}"

    created = create_deal(
        context["client"],
        context["organization_id"],
        context["stage"]["id"],
        context["test_data"],
        title=unique_title,
    )
    assert created.status_code == 201, created.text

    response = context["client"].get(
        "/deals/",
        params={"search": unique_title.lower()},
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["title"] == unique_title


def test_list_deals_pagination(deal_context):
    context = deal_context

    for _ in range(3):
        response = create_deal(
            context["client"],
            context["organization_id"],
            context["stage"]["id"],
            context["test_data"],
        )
        assert response.status_code == 201, response.text

    response = context["client"].get(
        "/deals/",
        params={"page": 1, "limit": 2},
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert response.status_code == 200
    assert response.json()["page"] == 1
    assert response.json()["limit"] == 2
    assert len(response.json()["items"]) == 2


@pytest.mark.parametrize(
    "params",
    [
        {"page": 0},
        {"limit": 0},
        {"limit": 101},
    ],
)
def test_list_deals_invalid_pagination(deal_context, params):
    context = deal_context

    response = context["client"].get(
        "/deals/",
        params=params,
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert response.status_code == 422


# --------------------------------------------------
# GET
# --------------------------------------------------

def test_get_deal_success(deal_context):
    context = deal_context

    created = create_deal(
        context["client"],
        context["organization_id"],
        context["stage"]["id"],
        context["test_data"],
    )
    assert created.status_code == 201

    deal_id = created.json()["id"]

    response = context["client"].get(
        f"/deals/{deal_id}",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert response.status_code == 200
    assert response.json()["id"] == deal_id


def test_get_nonexistent_deal_returns_404(deal_context):
    context = deal_context

    response = context["client"].get(
        "/deals/deals:nonexistent123",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert response.status_code == 404


# --------------------------------------------------
# UPDATE
# --------------------------------------------------

def test_update_deal_success(deal_context):
    context = deal_context

    created = create_deal(
        context["client"],
        context["organization_id"],
        context["stage"]["id"],
        context["test_data"],
    )
    assert created.status_code == 201, created.text

    deal_id = created.json()["id"]

    response = context["client"].put(
        f"/deals/{deal_id}",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
        json={
            "title": "Updated Pytest Deal",
            "value": 25000,
            "currency": "THB",
            "stage_id": context["stage"]["id"],
            "status": "WON",
            "company_id": None,
            "contact_id": None,
            "expected_close_date": None,
        },
    )

    assert response.status_code == 200, response.text
    assert response.json()["title"] == "Updated Pytest Deal"
    assert response.json()["status"] == "WON"
    assert float(response.json()["value"]) == 25000


def test_update_deal_with_invalid_status_returns_422(deal_context):
    context = deal_context

    created = create_deal(
        context["client"],
        context["organization_id"],
        context["stage"]["id"],
        context["test_data"],
    )
    assert created.status_code == 201

    response = context["client"].put(
        f"/deals/{created.json()['id']}",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
        json={
            "title": "Invalid Status Deal",
            "value": 1000,
            "currency": "THB",
            "stage_id": context["stage"]["id"],
            "status": "INVALID",
            "company_id": None,
            "contact_id": None,
            "expected_close_date": None,
        },
    )

    assert response.status_code == 422


def test_update_nonexistent_deal_returns_404(deal_context):
    context = deal_context

    response = context["client"].put(
        "/deals/deals:nonexistent123",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
        json={
            "title": "Updated Deal",
            "value": 1000,
            "currency": "THB",
            "stage_id": context["stage"]["id"],
            "status": "OPEN",
            "company_id": None,
            "contact_id": None,
            "expected_close_date": None,
        },
    )

    assert response.status_code == 404


# --------------------------------------------------
# DELETE
# --------------------------------------------------

def test_delete_deal_success(deal_context):
    context = deal_context

    created = create_deal(
        context["client"],
        context["organization_id"],
        context["stage"]["id"],
        context["test_data"],
    )
    assert created.status_code == 201

    deal_id = created.json()["id"]

    response = context["client"].delete(
        f"/deals/{deal_id}",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Deal deleted successfully"

    get_response = context["client"].get(
        f"/deals/{deal_id}",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert get_response.status_code == 404


def test_delete_nonexistent_deal_returns_404(deal_context):
    context = deal_context

    response = context["client"].delete(
        "/deals/deals:nonexistent123",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert response.status_code == 404


# --------------------------------------------------
# ORGANIZATION ISOLATION
# --------------------------------------------------

def test_deal_is_isolated_between_organizations(
    client,
    organization_isolation_context,
    test_data,
):
    context = organization_isolation_context

    organization_a_id = context["organization_a_id"]
    organization_b_id = context["organization_b_id"]

    # Create Deal in Organization A.
    context["authorization"]["login_as"]("ADMIN")

    pipeline = create_pipeline(client, organization_a_id, test_data)
    stage = create_stage(
        client,
        organization_a_id,
        pipeline["id"],
        test_data,
    )

    created = create_deal(
        client,
        organization_a_id,
        stage["id"],
        test_data,
    )
    assert created.status_code == 201, created.text

    deal_id = created.json()["id"]

    # Login as Organization B admin.
    outsider = context["outsider"]

    client.cookies.clear()

    login_response = client.post(
        "/auth/login",
        json={
            "email": outsider["email"],
            "password": outsider["password"],
        },
    )
    assert login_response.status_code == 200

    response = client.get(
        f"/deals/{deal_id}",
        headers={
            "X-Organization-ID": organization_b_id,
        },
    )

    assert response.status_code == 404

    list_response = client.get(
        "/deals/",
        headers={
            "X-Organization-ID": organization_b_id,
        },
    )

    assert list_response.status_code == 200
    assert all(
        item["id"] != deal_id
        for item in list_response.json()["items"]
    )
