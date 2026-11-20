
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
            "name": f"Activity Pipeline {uuid4().hex[:8]}",
            "description": "Pipeline for Activities tests",
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
            "name": f"Activity Stage {uuid4().hex[:8]}",
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
            "name": f"Activity Company {uuid4().hex[:8]}",
        },
    )

    assert response.status_code == 201, response.text

    company = response.json()
    test_data["companies"].append(company["id"])

    return company


def create_contact(client, organization_id, test_data, company_id=None):
    response = client.post(
        "/contacts/",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": f"Activity Contact {uuid4().hex[:8]}",
            "email": f"activity-{uuid4().hex}@example.com",
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


def create_deal(client, organization_id, stage_id, test_data):
    response = client.post(
        "/deals/",
        headers={"X-Organization-ID": organization_id},
        json={
            "title": f"Activity Deal {uuid4().hex[:8]}",
            "value": 10000,
            "currency": "THB",
            "stage_id": stage_id,
        },
    )

    assert response.status_code == 201, response.text

    deal = response.json()
    test_data["deals"].append(deal["id"])

    return deal


def create_activity(
    client,
    organization_id,
    test_data,
    deal_id=None,
    contact_id=None,
    **overrides,
):
    payload = {
        "subject": f"Activity {uuid4().hex[:8]}",
        "type": "CALL",
        "description": "Created by pytest",
        "deal_id": deal_id,
        "contact_id": contact_id,
    }

    payload.update(overrides)

    response = client.post(
        "/activities/",
        headers={"X-Organization-ID": organization_id},
        json=payload,
    )

    if response.status_code == 201:
        test_data["activities"].append(response.json()["id"])

    return response


# --------------------------------------------------
# FIXTURE
# --------------------------------------------------

@pytest.fixture
def activity_context(client, authorization_context, test_data):
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

    company = create_company(
        client,
        organization_id,
        test_data,
    )

    contact_id = create_contact(
        client,
        organization_id,
        test_data,
        company["id"],
    )

    deal = create_deal(
        client,
        organization_id,
        stage["id"],
        test_data,
    )

    return {
        "client": client,
        "organization_id": organization_id,
        "test_data": test_data,
        "pipeline": pipeline,
        "stage": stage,
        "company": company,
        "contact_id": contact_id,
        "deal": deal,
        "authorization": context,
    }


# --------------------------------------------------
# CREATE
# --------------------------------------------------

def test_create_activity_success(activity_context):
    context = activity_context

    response = create_activity(
        context["client"],
        context["organization_id"],
        context["test_data"],
    )

    assert response.status_code == 201, response.text

    body = response.json()

    assert body["subject"].startswith("Activity")
    assert body["type"] == "CALL"
    assert body["description"] == "Created by pytest"
    assert body["organization_id"] == context["organization_id"]


def test_create_activity_with_deal_and_contact(activity_context):
    context = activity_context

    response = create_activity(
        context["client"],
        context["organization_id"],
        context["test_data"],
        deal_id=context["deal"]["id"],
        contact_id=context["contact_id"],
    )

    assert response.status_code == 201, response.text

    body = response.json()

    assert body["deal_id"] == context["deal"]["id"]
    assert body["contact_id"] == context["contact_id"]


def test_create_activity_with_invalid_deal(activity_context):
    context = activity_context

    response = create_activity(
        context["client"],
        context["organization_id"],
        context["test_data"],
        deal_id="deals:nonexistent",
    )

    assert response.status_code == 404


def test_create_activity_with_invalid_contact(activity_context):
    context = activity_context

    response = create_activity(
        context["client"],
        context["organization_id"],
        context["test_data"],
        contact_id="contacts:nonexistent",
    )

    assert response.status_code == 404


def test_create_activity_validation_error(activity_context):
    context = activity_context

    response = context["client"].post(
        "/activities/",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
        json={
            "subject": "A",
            "type": "CALL",
            "unexpected_field": "not allowed",
        },
    )

    assert response.status_code == 422


# --------------------------------------------------
# LIST
# --------------------------------------------------

def test_list_activities_success(activity_context):
    context = activity_context

    create_activity(
        context["client"],
        context["organization_id"],
        context["test_data"],
    )

    response = context["client"].get(
        "/activities/",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert response.status_code == 200, response.text

    body = response.json()

    assert "items" in body
    assert "total" in body
    assert "page" in body
    assert "limit" in body
    assert "total_pages" in body

    assert body["total"] >= 1
    assert body["page"] == 1


def test_list_activities_pagination(activity_context):
    context = activity_context

    for _ in range(3):
        response = create_activity(
            context["client"],
            context["organization_id"],
            context["test_data"],
        )
        assert response.status_code == 201, response.text

    response = context["client"].get(
        "/activities/?page=1&limit=2",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert response.status_code == 200, response.text

    body = response.json()

    assert body["page"] == 1
    assert body["limit"] == 2
    assert len(body["items"]) <= 2
    assert body["total"] >= 3


def test_list_activities_invalid_pagination(activity_context):
    context = activity_context

    response = context["client"].get(
        "/activities/?page=0&limit=101",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert response.status_code == 422


# --------------------------------------------------
# RETRIEVE
# --------------------------------------------------

def test_retrieve_activity_success(activity_context):
    context = activity_context

    created = create_activity(
        context["client"],
        context["organization_id"],
        context["test_data"],
    )

    assert created.status_code == 201, created.text

    activity_id = created.json()["id"]

    response = context["client"].get(
        f"/activities/{activity_id}",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert response.status_code == 200, response.text
    assert response.json()["id"] == activity_id


def test_retrieve_activity_not_found(activity_context):
    context = activity_context

    response = context["client"].get(
        "/activities/activities:nonexistent",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert response.status_code == 404


# --------------------------------------------------
# UPDATE
# --------------------------------------------------

def test_update_activity_success(activity_context):
    context = activity_context

    created = create_activity(
        context["client"],
        context["organization_id"],
        context["test_data"],
    )

    assert created.status_code == 201, created.text

    activity_id = created.json()["id"]

    response = context["client"].put(
        f"/activities/{activity_id}",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
        json={
            "subject": "Updated Activity Subject",
            "type": "MEETING",
            "description": "Updated by pytest",
            "deal_id": context["deal"]["id"],
            "contact_id": context["contact_id"],
        },
    )

    assert response.status_code == 200, response.text

    body = response.json()

    assert body["subject"] == "Updated Activity Subject"
    assert body["type"] == "MEETING"
    assert body["description"] == "Updated by pytest"
    assert body["deal_id"] == context["deal"]["id"]
    assert body["contact_id"] == context["contact_id"]


def test_update_activity_not_found(activity_context):
    context = activity_context

    response = context["client"].put(
        "/activities/activities:nonexistent",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
        json={
            "subject": "Updated Activity",
            "type": "MEETING",
            "description": "Updated",
        },
    )

    assert response.status_code == 404


def test_update_activity_with_invalid_related_record(activity_context):
    context = activity_context

    created = create_activity(
        context["client"],
        context["organization_id"],
        context["test_data"],
    )

    assert created.status_code == 201, created.text

    activity_id = created.json()["id"]

    response = context["client"].put(
        f"/activities/{activity_id}",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
        json={
            "subject": "Updated Activity",
            "type": "MEETING",
            "description": "Updated",
            "deal_id": "deals:nonexistent",
        },
    )

    assert response.status_code == 404


# --------------------------------------------------
# DELETE
# --------------------------------------------------

def test_delete_activity_success(activity_context):
    context = activity_context

    created = create_activity(
        context["client"],
        context["organization_id"],
        context["test_data"],
    )

    assert created.status_code == 201, created.text

    activity_id = created.json()["id"]

    response = context["client"].delete(
        f"/activities/{activity_id}",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert response.status_code == 200, response.text
    assert response.json()["message"] == "Activity deleted successfully"

    retrieve_response = context["client"].get(
        f"/activities/{activity_id}",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert retrieve_response.status_code == 404


def test_delete_activity_not_found(activity_context):
    context = activity_context

    response = context["client"].delete(
        "/activities/activities:nonexistent",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert response.status_code == 404
