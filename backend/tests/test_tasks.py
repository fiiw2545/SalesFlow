
from datetime import datetime, timezone
from uuid import uuid4

import pytest


def normalize_record_id(record_id):
    record_id = str(record_id)

    if ":" in record_id:
        return record_id

    return record_id


def create_pipeline(client, test_data, organization_id):
    response = client.post(
        "/pipelines/",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": f"Task Test Pipeline {uuid4().hex[:8]}",
            "description": "Pipeline for task tests",
            "is_default": False,
        },
    )

    assert response.status_code == 201, response.text

    pipeline = response.json()
    test_data["pipelines"].append(pipeline["id"])

    return pipeline


def create_stage(client, test_data, organization_id, pipeline_id):
    response = client.post(
        f"/pipelines/{pipeline_id}/stages/",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": "Task Test Stage",
            "position": 1,
            "probability": 20,
        },
    )

    assert response.status_code == 201, response.text

    stage = response.json()
    test_data["stages"].append(stage["id"])

    return stage


def create_deal(client, test_data, organization_id, stage_id):
    response = client.post(
        "/deals/",
        headers={"X-Organization-ID": organization_id},
        json={
            "title": f"Task Test Deal {uuid4().hex[:8]}",
            "value": 10000,
            "currency": "THB",
            "stage_id": stage_id,
        },
    )

    assert response.status_code == 201, response.text

    deal = response.json()
    test_data["deals"].append(deal["id"])

    return deal




def create_contact(client, test_data, organization_id):
    response = client.post(
        "/contacts/",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": f"Task Test Contact {uuid4().hex[:8]}",
            "email": f"task-{uuid4().hex}@example.com",
            "phone": "0812345678",
            "age": 25,
            "company_id": None,
            "position": "Developer",
        },
    )

    assert response.status_code == 201, response.text

    contacts = response.json()["data"]

    assert isinstance(contacts, list), response.json()
    assert len(contacts) > 0, response.json()

    contact = contacts[0]

    # Convert SurrealDB RecordID dictionary to table:id string.
    contact_id = contact["id"]

    if isinstance(contact_id, dict):
        contact_id = (
            f'{contact_id["table_name"]}:{contact_id["id"]}'
        )
    else:
        contact_id = str(contact_id)

    contact["id"] = contact_id
    test_data["contacts"].append(contact_id)

    return contact



def create_task(client, organization_id, **overrides):
    payload = {
        "title": f"Pytest Task {uuid4().hex[:8]}",
        "description": "Task created for automated testing",
        "priority": "MEDIUM",
        "status": "PENDING",
    }

    payload.update(overrides)

    return client.post(
        "/tasks/",
        headers={"X-Organization-ID": organization_id},
        json=payload,
    )


@pytest.fixture
def task_context(authorization_context, test_data):
    client = authorization_context["client"]
    organization_id = authorization_context["organization_id"]

    pipeline = create_pipeline(
        client,
        test_data,
        organization_id,
    )

    stage = create_stage(
        client,
        test_data,
        organization_id,
        pipeline["id"],
    )

    deal = create_deal(
        client,
        test_data,
        organization_id,
        stage["id"],
    )

    contact = create_contact(
        client,
        test_data,
        organization_id,
    )

    return {
        "client": client,
        "organization_id": organization_id,
        "pipeline": pipeline,
        "stage": stage,
        "deal": deal,
        "contact": contact,
        "test_data": test_data,
    }


def track_task(response, test_data):
    if response.status_code == 201:
        test_data["tasks"].append(response.json()["id"])


# --------------------------------------------------
# CREATE
# --------------------------------------------------

def test_create_task_success(task_context):
    response = create_task(
        task_context["client"],
        task_context["organization_id"],
    )

    assert response.status_code == 201, response.text

    task = response.json()
    task_context["test_data"]["tasks"].append(task["id"])

    assert task["title"].startswith("Pytest Task")
    assert task["priority"] == "MEDIUM"
    assert task["status"] == "PENDING"
    assert task["completed_at"] is None
    assert task["organization_id"] == task_context["organization_id"]



def test_create_task_with_deal_and_contact(task_context):
    client = task_context["client"]
    organization_id = task_context["organization_id"]
    test_data = task_context["test_data"]

    # Test Deal relationship independently.
    deal_response = create_task(
        client,
        organization_id,
        deal_id=str(task_context["deal"]["id"]),
    )

    print("DEAL RESPONSE:", deal_response.status_code, deal_response.text)

    assert deal_response.status_code == 201, (
        f"Deal validation failed: {deal_response.text}"
    )

    test_data["tasks"].append(deal_response.json()["id"])

    # Test Contact relationship independently.
    contact_response = create_task(
        client,
        organization_id,
        contact_id=str(task_context["contact"]["id"]),
    )

    print(
        "CONTACT RESPONSE:",
        contact_response.status_code,
        contact_response.text,
    )

    assert contact_response.status_code == 201, (
        f"Contact validation failed: {contact_response.text}"
    )

    test_data["tasks"].append(contact_response.json()["id"])



def test_create_completed_task_sets_completed_at(task_context):
    response = create_task(
        task_context["client"],
        task_context["organization_id"],
        status="COMPLETED",
    )

    assert response.status_code == 201, response.text

    task = response.json()
    task_context["test_data"]["tasks"].append(task["id"])

    assert task["status"] == "COMPLETED"
    assert task["completed_at"] is not None


@pytest.mark.parametrize(
    "payload",
    [
        {"title": "A"},
        {"priority": "INVALID"},
        {"status": "INVALID"},
        {"unknown_field": "not allowed"},
    ],
)
def test_create_task_validation_error(task_context, payload):
    response = create_task(
        task_context["client"],
        task_context["organization_id"],
        **payload,
    )

    assert response.status_code == 422, response.text


def test_create_task_with_nonexistent_deal_returns_404(task_context):
    response = create_task(
        task_context["client"],
        task_context["organization_id"],
        deal_id="deals:nonexistent",
    )

    assert response.status_code == 404


def test_create_task_with_nonexistent_contact_returns_404(task_context):
    response = create_task(
        task_context["client"],
        task_context["organization_id"],
        contact_id="contacts:nonexistent",
    )

    assert response.status_code == 404


# --------------------------------------------------
# LIST / PAGINATION
# --------------------------------------------------

def test_list_tasks(task_context):
    client = task_context["client"]
    organization_id = task_context["organization_id"]
    test_data = task_context["test_data"]

    for _ in range(3):
        response = create_task(client, organization_id)
        assert response.status_code == 201, response.text
        test_data["tasks"].append(response.json()["id"])

    response = client.get(
        "/tasks/",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200, response.text

    result = response.json()

    assert len(result["items"]) >= 3
    assert result["total"] >= 3
    assert result["page"] == 1
    assert result["limit"] == 10


def test_list_tasks_pagination(task_context):
    client = task_context["client"]
    organization_id = task_context["organization_id"]
    test_data = task_context["test_data"]

    for _ in range(3):
        response = create_task(client, organization_id)
        assert response.status_code == 201, response.text
        test_data["tasks"].append(response.json()["id"])

    response = client.get(
        "/tasks/?page=1&limit=2",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200, response.text

    result = response.json()

    assert len(result["items"]) == 2
    assert result["page"] == 1
    assert result["limit"] == 2
    assert result["total_pages"] >= 2


@pytest.mark.parametrize(
    "query",
    [
        "?page=0",
        "?limit=0",
        "?limit=101",
    ],
)
def test_list_tasks_invalid_pagination(task_context, query):
    response = task_context["client"].get(
        f"/tasks/{query}",
        headers={
            "X-Organization-ID": task_context["organization_id"],
        },
    )

    assert response.status_code == 422


# --------------------------------------------------
# GET
# --------------------------------------------------

def test_get_task_success(task_context):
    response = create_task(
        task_context["client"],
        task_context["organization_id"],
    )

    assert response.status_code == 201, response.text

    task = response.json()
    task_context["test_data"]["tasks"].append(task["id"])

    get_response = task_context["client"].get(
        f"/tasks/{task['id']}",
        headers={
            "X-Organization-ID": task_context["organization_id"],
        },
    )

    assert get_response.status_code == 200, get_response.text
    assert get_response.json()["id"] == task["id"]


def test_get_nonexistent_task_returns_404(task_context):
    response = task_context["client"].get(
        "/tasks/tasks:nonexistent",
        headers={
            "X-Organization-ID": task_context["organization_id"],
        },
    )

    assert response.status_code == 404


# --------------------------------------------------
# UPDATE
# --------------------------------------------------

def test_update_task_success(task_context):
    client = task_context["client"]
    organization_id = task_context["organization_id"]

    create_response = create_task(client, organization_id)

    assert create_response.status_code == 201, create_response.text

    task = create_response.json()
    task_context["test_data"]["tasks"].append(task["id"])

    update_response = client.put(
        f"/tasks/{task['id']}",
        headers={"X-Organization-ID": organization_id},
        json={
            "title": "Updated Pytest Task",
            "description": "Updated description",
            "priority": "HIGH",
            "status": "IN_PROGRESS",
            "deal_id": None,
            "contact_id": None,
        },
    )

    assert update_response.status_code == 200, update_response.text

    updated = update_response.json()

    assert updated["title"] == "Updated Pytest Task"
    assert updated["priority"] == "HIGH"
    assert updated["status"] == "IN_PROGRESS"
    assert updated["completed_at"] is None


def test_update_task_to_completed_sets_completed_at(task_context):
    client = task_context["client"]
    organization_id = task_context["organization_id"]

    create_response = create_task(client, organization_id)

    assert create_response.status_code == 201, create_response.text

    task = create_response.json()
    task_context["test_data"]["tasks"].append(task["id"])

    response = client.put(
        f"/tasks/{task['id']}",
        headers={"X-Organization-ID": organization_id},
        json={
            "title": task["title"],
            "description": task["description"],
            "priority": "MEDIUM",
            "status": "COMPLETED",
            "deal_id": None,
            "contact_id": None,
        },
    )

    assert response.status_code == 200, response.text
    assert response.json()["completed_at"] is not None


def test_update_completed_task_to_pending_clears_completed_at(task_context):
    client = task_context["client"]
    organization_id = task_context["organization_id"]

    create_response = create_task(
        client,
        organization_id,
        status="COMPLETED",
    )

    assert create_response.status_code == 201, create_response.text

    task = create_response.json()
    task_context["test_data"]["tasks"].append(task["id"])

    response = client.put(
        f"/tasks/{task['id']}",
        headers={"X-Organization-ID": organization_id},
        json={
            "title": task["title"],
            "description": task["description"],
            "priority": "MEDIUM",
            "status": "PENDING",
            "deal_id": None,
            "contact_id": None,
        },
    )

    assert response.status_code == 200, response.text
    assert response.json()["completed_at"] is None


def test_update_task_with_nonexistent_deal_returns_404(task_context):
    client = task_context["client"]
    organization_id = task_context["organization_id"]

    create_response = create_task(client, organization_id)

    assert create_response.status_code == 201, create_response.text

    task = create_response.json()
    task_context["test_data"]["tasks"].append(task["id"])

    response = client.put(
        f"/tasks/{task['id']}",
        headers={"X-Organization-ID": organization_id},
        json={
            "title": task["title"],
            "description": task["description"],
            "priority": "MEDIUM",
            "status": "PENDING",
            "deal_id": "deals:nonexistent",
            "contact_id": None,
        },
    )

    assert response.status_code == 404


def test_update_nonexistent_task_returns_404(task_context):
    response = task_context["client"].put(
        "/tasks/tasks:nonexistent",
        headers={
            "X-Organization-ID": task_context["organization_id"],
        },
        json={
            "title": "Updated Task",
            "description": None,
            "priority": "MEDIUM",
            "status": "PENDING",
            "deal_id": None,
            "contact_id": None,
        },
    )

    assert response.status_code == 404


# --------------------------------------------------
# DELETE
# --------------------------------------------------

def test_delete_task_success(task_context):
    client = task_context["client"]
    organization_id = task_context["organization_id"]

    create_response = create_task(client, organization_id)

    assert create_response.status_code == 201, create_response.text

    task = create_response.json()

    delete_response = client.delete(
        f"/tasks/{task['id']}",
        headers={"X-Organization-ID": organization_id},
    )

    assert delete_response.status_code == 200
    assert delete_response.json()["message"] == "Task deleted successfully"

    # Remove the deleted record from cleanup tracking.
    task_context["test_data"]["tasks"].append(task["id"])

    get_response = client.get(
        f"/tasks/{task['id']}",
        headers={"X-Organization-ID": organization_id},
    )

    assert get_response.status_code == 404


def test_delete_nonexistent_task_returns_404(task_context):
    response = task_context["client"].delete(
        "/tasks/tasks:nonexistent",
        headers={
            "X-Organization-ID": task_context["organization_id"],
        },
    )

    assert response.status_code == 404


# --------------------------------------------------
# ORGANIZATION ISOLATION
# --------------------------------------------------

def test_task_is_isolated_between_organizations(
    client,
    test_data,
    organization_isolation_context,
):
    organization_a_id = (
        organization_isolation_context["organization_a_id"]
    )
    outsider = organization_isolation_context["outsider"]

    # Login as an ADMIN in Organization A.
    authorization = organization_isolation_context["authorization"]
    client = authorization["login_as"]("ADMIN")

    create_response = create_task(
        client,
        organization_a_id,
    )

    assert create_response.status_code == 201, create_response.text

    task = create_response.json()
    test_data["tasks"].append(task["id"])

    # Login as outsider, who belongs to Organization B.
    client.cookies.clear()

    login_response = client.post(
        "/auth/login",
        json={
            "email": outsider["email"],
            "password": outsider["password"],
        },
    )

    assert login_response.status_code == 200, login_response.text

    response = client.get(
        f"/tasks/{task['id']}",
        headers={
            "X-Organization-ID": organization_a_id,
        },
    )

    assert response.status_code == 403
