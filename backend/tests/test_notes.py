
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
            "name": f"Note Pipeline {uuid4().hex[:8]}",
            "description": "Pipeline for Notes tests",
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
            "name": f"Note Stage {uuid4().hex[:8]}",
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
            "name": f"Note Company {uuid4().hex[:8]}",
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
            "name": f"Note Contact {uuid4().hex[:8]}",
            "email": f"note-{uuid4().hex}@example.com",
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
            "title": f"Note Deal {uuid4().hex[:8]}",
            "value": 10000,
            "currency": "THB",
            "stage_id": stage_id,
        },
    )

    assert response.status_code == 201, response.text

    deal = response.json()
    test_data["deals"].append(deal["id"])

    return deal


def create_note(
    client,
    organization_id,
    test_data,
    company_id=None,
    contact_id=None,
    deal_id=None,
    **overrides,
):
    payload = {
        "title": f"Pytest Note {uuid4().hex[:8]}",
        "content": "Note content created by pytest",
        "company_id": company_id,
        "contact_id": contact_id,
        "deal_id": deal_id,
    }

    payload.update(overrides)

    response = client.post(
        "/notes/",
        headers={"X-Organization-ID": organization_id},
        json=payload,
    )

    if response.status_code == 201:
        test_data["notes"].append(response.json()["id"])

    return response


# --------------------------------------------------
# FIXTURE
# --------------------------------------------------

@pytest.fixture
def note_context(client, authorization_context, test_data):
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

def test_create_note_success(note_context):
    context = note_context

    response = create_note(
        context["client"],
        context["organization_id"],
        context["test_data"],
    )

    assert response.status_code == 201, response.text

    body = response.json()

    assert body["title"].startswith("Pytest Note")
    assert body["content"] == "Note content created by pytest"
    assert body["organization_id"] == context["organization_id"]
    assert body["created_by"] == context["authorization"]["users"]["ADMIN"]["id"]


def test_create_note_with_company(note_context):
    context = note_context

    response = create_note(
        context["client"],
        context["organization_id"],
        context["test_data"],
        company_id=context["company"]["id"],
    )

    assert response.status_code == 201, response.text
    assert response.json()["company_id"] == context["company"]["id"]


def test_create_note_with_contact(note_context):
    context = note_context

    response = create_note(
        context["client"],
        context["organization_id"],
        context["test_data"],
        contact_id=context["contact_id"],
    )

    assert response.status_code == 201, response.text
    assert response.json()["contact_id"] == context["contact_id"]


def test_create_note_with_deal(note_context):
    context = note_context

    response = create_note(
        context["client"],
        context["organization_id"],
        context["test_data"],
        deal_id=context["deal"]["id"],
    )

    assert response.status_code == 201, response.text
    assert response.json()["deal_id"] == context["deal"]["id"]


def test_create_note_with_all_related_records(note_context):
    context = note_context

    response = create_note(
        context["client"],
        context["organization_id"],
        context["test_data"],
        company_id=context["company"]["id"],
        contact_id=context["contact_id"],
        deal_id=context["deal"]["id"],
    )

    assert response.status_code == 201, response.text

    body = response.json()

    assert body["company_id"] == context["company"]["id"]
    assert body["contact_id"] == context["contact_id"]
    assert body["deal_id"] == context["deal"]["id"]


@pytest.mark.parametrize(
    ("field", "record_id"),
    [
        ("company_id", "companies:nonexistent"),
        ("contact_id", "contacts:nonexistent"),
        ("deal_id", "deals:nonexistent"),
    ],
)
def test_create_note_with_invalid_related_record(
    note_context,
    field,
    record_id,
):
    context = note_context

    response = create_note(
        context["client"],
        context["organization_id"],
        context["test_data"],
        **{field: record_id},
    )

    assert response.status_code == 404


@pytest.mark.parametrize(
    "payload",
    [
        {
            "title": "A",
            "content": "Valid content",
        },
        {
            "title": "Valid title",
            "content": "",
        },
        {
            "title": "Valid title",
            "content": "Valid content",
            "unexpected_field": "not allowed",
        },
    ],
)
def test_create_note_validation_error(note_context, payload):
    context = note_context

    response = context["client"].post(
        "/notes/",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
        json=payload,
    )

    assert response.status_code == 422


# --------------------------------------------------
# LIST
# --------------------------------------------------

def test_list_notes_success(note_context):
    context = note_context

    created = create_note(
        context["client"],
        context["organization_id"],
        context["test_data"],
    )

    assert created.status_code == 201, created.text

    response = context["client"].get(
        "/notes/",
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


def test_list_notes_pagination(note_context):
    context = note_context

    for _ in range(3):
        response = create_note(
            context["client"],
            context["organization_id"],
            context["test_data"],
        )
        assert response.status_code == 201, response.text

    response = context["client"].get(
        "/notes/?page=1&limit=2",
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


def test_list_notes_invalid_pagination(note_context):
    context = note_context

    response = context["client"].get(
        "/notes/?page=0&limit=101",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert response.status_code == 422


# --------------------------------------------------
# RETRIEVE
# --------------------------------------------------

def test_retrieve_note_success(note_context):
    context = note_context

    created = create_note(
        context["client"],
        context["organization_id"],
        context["test_data"],
    )

    assert created.status_code == 201, created.text

    note_id = created.json()["id"]

    response = context["client"].get(
        f"/notes/{note_id}",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert response.status_code == 200, response.text
    assert response.json()["id"] == note_id


def test_retrieve_note_not_found(note_context):
    context = note_context

    response = context["client"].get(
        "/notes/notes:nonexistent",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert response.status_code == 404


# --------------------------------------------------
# UPDATE
# --------------------------------------------------

def test_update_note_success(note_context):
    context = note_context

    created = create_note(
        context["client"],
        context["organization_id"],
        context["test_data"],
    )

    assert created.status_code == 201, created.text

    note_id = created.json()["id"]

    response = context["client"].put(
        f"/notes/{note_id}",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
        json={
            "title": "Updated Note Title",
            "content": "Updated note content",
            "company_id": context["company"]["id"],
            "contact_id": context["contact_id"],
            "deal_id": context["deal"]["id"],
        },
    )

    assert response.status_code == 200, response.text

    body = response.json()

    assert body["title"] == "Updated Note Title"
    assert body["content"] == "Updated note content"
    assert body["company_id"] == context["company"]["id"]
    assert body["contact_id"] == context["contact_id"]
    assert body["deal_id"] == context["deal"]["id"]
    assert body["updated_at"] is not None


def test_update_note_not_found(note_context):
    context = note_context

    response = context["client"].put(
        "/notes/notes:nonexistent",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
        json={
            "title": "Updated Note",
            "content": "Updated content",
        },
    )

    assert response.status_code == 404


@pytest.mark.parametrize(
    ("field", "record_id"),
    [
        ("company_id", "companies:nonexistent"),
        ("contact_id", "contacts:nonexistent"),
        ("deal_id", "deals:nonexistent"),
    ],
)
def test_update_note_with_invalid_related_record(
    note_context,
    field,
    record_id,
):
    context = note_context

    created = create_note(
        context["client"],
        context["organization_id"],
        context["test_data"],
    )

    assert created.status_code == 201, created.text

    note_id = created.json()["id"]

    response = context["client"].put(
        f"/notes/{note_id}",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
        json={
            "title": "Updated Note",
            "content": "Updated content",
            field: record_id,
        },
    )

    assert response.status_code == 404


def test_update_note_validation_error(note_context):
    context = note_context

    response = context["client"].put(
        "/notes/notes:nonexistent",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
        json={
            "title": "A",
            "content": "Updated content",
        },
    )

    assert response.status_code == 422


# --------------------------------------------------
# DELETE
# --------------------------------------------------

def test_delete_note_success(note_context):
    context = note_context

    created = create_note(
        context["client"],
        context["organization_id"],
        context["test_data"],
    )

    assert created.status_code == 201, created.text

    note_id = created.json()["id"]

    response = context["client"].delete(
        f"/notes/{note_id}",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert response.status_code == 200, response.text
    assert response.json()["message"] == "Note deleted successfully"

    retrieve_response = context["client"].get(
        f"/notes/{note_id}",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert retrieve_response.status_code == 404


def test_delete_note_not_found(note_context):
    context = note_context

    response = context["client"].delete(
        "/notes/notes:nonexistent",
        headers={
            "X-Organization-ID": context["organization_id"],
        },
    )

    assert response.status_code == 404
