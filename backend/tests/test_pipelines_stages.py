
from uuid import uuid4

import pytest


# ============================================================
# Helpers
# ============================================================

def create_pipeline(
    client,
    test_data,
    organization_id,
    name=None,
    description="Pytest pipeline",
    is_default=False,
):
    name = name or f"Pytest Pipeline {uuid4().hex[:8]}"

    response = client.post(
        "/pipelines/",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": name,
            "description": description,
            "is_default": is_default,
        },
    )

    assert response.status_code == 201, response.text

    pipeline = response.json()
    test_data["pipelines"].append(pipeline["id"])

    return pipeline


def create_stage(
    client,
    test_data,
    organization_id,
    pipeline_id,
    name=None,
    position=1,
    probability=0,
):
    name = name or f"Pytest Stage {uuid4().hex[:8]}"

    response = client.post(
        f"/pipelines/{pipeline_id}/stages/",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": name,
            "position": position,
            "probability": probability,
        },
    )

    assert response.status_code == 201, response.text

    stage = response.json()
    test_data["stages"].append(stage["id"])

    return stage


def create_deal(
    client,
    test_data,
    organization_id,
    stage_id,
):
    response = client.post(
        "/deals/",
        headers={"X-Organization-ID": organization_id},
        json={
            "title": f"Pytest Deal {uuid4().hex[:8]}",
            "value": 10000,
            "currency": "THB",
            "stage_id": stage_id,
        },
    )

    assert response.status_code == 201, response.text

    deal = response.json()
    test_data["deals"].append(deal["id"])

    return deal


# ============================================================
# Fixtures
# ============================================================

@pytest.fixture
def pipeline_context(authorization_context):
    return {
        "client": authorization_context["client"],
        "organization_id": authorization_context["organization_id"],
        "users": authorization_context["users"],
        "login_as": authorization_context["login_as"],
    }


# ============================================================
# Pipeline - Create
# ============================================================

def test_create_pipeline_success(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(
        client,
        test_data,
        organization_id,
        name="Sales Pipeline Test",
        description="Pipeline description",
    )

    assert pipeline["name"] == "Sales Pipeline Test"
    assert pipeline["description"] == "Pipeline description"
    assert pipeline["is_default"] is False
    assert pipeline["id"] in test_data["pipelines"]


@pytest.mark.parametrize(
    "payload",
    [
        {
            "name": "A",
        },
        {
            "name": "A" * 101,
        },
        {
            "name": "Valid Pipeline",
            "unknown": "field",
        },
        {
            "description": "Missing name",
        },
    ],
)
def test_create_pipeline_validation_error(
    pipeline_context,
    payload,
):
    response = pipeline_context["client"].post(
        "/pipelines/",
        headers={
            "X-Organization-ID": pipeline_context["organization_id"],
        },
        json=payload,
    )

    assert response.status_code == 422


def test_create_duplicate_pipeline_returns_409(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    create_pipeline(
        client,
        test_data,
        organization_id,
        name="Duplicate Pipeline",
    )

    response = client.post(
        "/pipelines/",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": "Duplicate Pipeline",
            "description": "Another pipeline",
            "is_default": False,
        },
    )

    assert response.status_code == 409


def test_create_default_pipeline(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(
        client,
        test_data,
        organization_id,
        is_default=True,
    )

    assert pipeline["is_default"] is True


def test_creating_new_default_pipeline_clears_previous_default(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    first = create_pipeline(
        client,
        test_data,
        organization_id,
        name="First Default Pipeline",
        is_default=True,
    )

    second = create_pipeline(
        client,
        test_data,
        organization_id,
        name="Second Default Pipeline",
        is_default=True,
    )

    first_response = client.get(
        f"/pipelines/{first['id']}",
        headers={"X-Organization-ID": organization_id},
    )

    second_response = client.get(
        f"/pipelines/{second['id']}",
        headers={"X-Organization-ID": organization_id},
    )

    assert first_response.status_code == 200
    assert second_response.status_code == 200

    assert first_response.json()["is_default"] is False
    assert second_response.json()["is_default"] is True


# ============================================================
# Pipeline - Read
# ============================================================

def test_list_pipelines(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    create_pipeline(client, test_data, organization_id)
    create_pipeline(client, test_data, organization_id)

    response = client.get(
        "/pipelines/",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200

    body = response.json()

    assert body["total"] >= 2
    assert len(body["items"]) >= 2
    assert body["page"] == 1
    assert body["limit"] == 10


def test_list_pipelines_pagination(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    for _ in range(3):
        create_pipeline(client, test_data, organization_id)

    response = client.get(
        "/pipelines/?page=1&limit=2",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200

    body = response.json()

    assert len(body["items"]) == 2
    assert body["page"] == 1
    assert body["limit"] == 2
    assert body["total"] >= 3


@pytest.mark.parametrize(
    "params",
    [
        "page=0",
        "limit=0",
        "limit=101",
    ],
)
def test_list_pipelines_invalid_pagination(
    pipeline_context,
    params,
):
    response = pipeline_context["client"].get(
        f"/pipelines/?{params}",
        headers={
            "X-Organization-ID": pipeline_context["organization_id"],
        },
    )

    assert response.status_code == 422


def test_get_pipeline_success(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(
        client,
        test_data,
        organization_id,
    )

    response = client.get(
        f"/pipelines/{pipeline['id']}",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200
    assert response.json()["id"] == pipeline["id"]


def test_get_nonexistent_pipeline_returns_404(
    pipeline_context,
):
    response = pipeline_context["client"].get(
        "/pipelines/pipelines:nonexistent",
        headers={
            "X-Organization-ID": pipeline_context["organization_id"],
        },
    )

    assert response.status_code == 404


# ============================================================
# Pipeline - Update
# ============================================================

def test_update_pipeline_success(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(
        client,
        test_data,
        organization_id,
    )

    response = client.put(
        f"/pipelines/{pipeline['id']}",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": "Updated Pipeline",
            "description": "Updated description",
            "is_default": False,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["name"] == "Updated Pipeline"
    assert body["description"] == "Updated description"


def test_update_pipeline_duplicate_name_returns_409(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    create_pipeline(
        client,
        test_data,
        organization_id,
        name="Existing Pipeline",
    )

    second = create_pipeline(
        client,
        test_data,
        organization_id,
        name="Another Pipeline",
    )

    response = client.put(
        f"/pipelines/{second['id']}",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": "Existing Pipeline",
            "description": None,
            "is_default": False,
        },
    )

    assert response.status_code == 409


def test_update_pipeline_invalid_payload_returns_422(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(
        client,
        test_data,
        organization_id,
    )

    response = client.put(
        f"/pipelines/{pipeline['id']}",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": "A",
            "description": None,
            "is_default": False,
        },
    )

    assert response.status_code == 422


def test_update_nonexistent_pipeline_returns_404(
    pipeline_context,
):
    response = pipeline_context["client"].put(
        "/pipelines/pipelines:nonexistent",
        headers={
            "X-Organization-ID": pipeline_context["organization_id"],
        },
        json={
            "name": "Updated Pipeline",
            "description": None,
            "is_default": False,
        },
    )

    assert response.status_code == 404


def test_update_pipeline_to_default_clears_previous_default(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    first = create_pipeline(
        client,
        test_data,
        organization_id,
        name="Existing Default",
        is_default=True,
    )

    second = create_pipeline(
        client,
        test_data,
        organization_id,
        name="New Default",
    )

    response = client.put(
        f"/pipelines/{second['id']}",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": "New Default",
            "description": None,
            "is_default": True,
        },
    )

    assert response.status_code == 200
    assert response.json()["is_default"] is True

    first_response = client.get(
        f"/pipelines/{first['id']}",
        headers={"X-Organization-ID": organization_id},
    )

    assert first_response.json()["is_default"] is False


# ============================================================
# Pipeline - Delete
# ============================================================

def test_delete_pipeline_success(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(
        client,
        test_data,
        organization_id,
    )

    response = client.delete(
        f"/pipelines/{pipeline['id']}",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Pipeline deleted successfully"

    get_response = client.get(
        f"/pipelines/{pipeline['id']}",
        headers={"X-Organization-ID": organization_id},
    )

    assert get_response.status_code == 404


def test_delete_pipeline_with_stages_returns_409(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(
        client,
        test_data,
        organization_id,
    )

    create_stage(
        client,
        test_data,
        organization_id,
        pipeline["id"],
    )

    response = client.delete(
        f"/pipelines/{pipeline['id']}",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 409


def test_delete_nonexistent_pipeline_returns_404(
    pipeline_context,
):
    response = pipeline_context["client"].delete(
        "/pipelines/pipelines:nonexistent",
        headers={
            "X-Organization-ID": pipeline_context["organization_id"],
        },
    )

    assert response.status_code == 404


# ============================================================
# Stage - Create
# ============================================================

def test_create_stage_success(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

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
        name="New Lead",
        position=1,
        probability=10,
    )

    assert stage["name"] == "New Lead"
    assert stage["position"] == 1
    assert stage["probability"] == 10
    assert stage["pipeline_id"] == pipeline["id"]


@pytest.mark.parametrize(
    "payload",
    [
        {
            "name": "A",
            "position": 1,
            "probability": 0,
        },
        {
            "name": "Valid Stage",
            "position": 0,
            "probability": 0,
        },
        {
            "name": "Valid Stage",
            "position": 1,
            "probability": -1,
        },
        {
            "name": "Valid Stage",
            "position": 1,
            "probability": 101,
        },
        {
            "name": "Valid Stage",
            "position": 1,
            "probability": 0,
            "unknown": "field",
        },
    ],
)
def test_create_stage_validation_error(
    pipeline_context,
    test_data,
    payload,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(
        client,
        test_data,
        organization_id,
    )

    response = client.post(
        f"/pipelines/{pipeline['id']}/stages/",
        headers={"X-Organization-ID": organization_id},
        json=payload,
    )

    assert response.status_code == 422


def test_create_stage_with_duplicate_name_returns_409(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(client, test_data, organization_id)

    create_stage(
        client,
        test_data,
        organization_id,
        pipeline["id"],
        name="Qualified",
        position=1,
    )

    response = client.post(
        f"/pipelines/{pipeline['id']}/stages/",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": "Qualified",
            "position": 2,
            "probability": 50,
        },
    )

    assert response.status_code == 409


def test_create_stage_with_duplicate_position_returns_409(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(client, test_data, organization_id)

    create_stage(
        client,
        test_data,
        organization_id,
        pipeline["id"],
        name="New Lead",
        position=1,
    )

    response = client.post(
        f"/pipelines/{pipeline['id']}/stages/",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": "Qualified",
            "position": 1,
            "probability": 50,
        },
    )

    assert response.status_code == 409


def test_create_stage_for_nonexistent_pipeline_returns_404(
    pipeline_context,
):
    response = pipeline_context["client"].post(
        "/pipelines/pipelines:nonexistent/stages/",
        headers={
            "X-Organization-ID": pipeline_context["organization_id"],
        },
        json={
            "name": "New Lead",
            "position": 1,
            "probability": 10,
        },
    )

    assert response.status_code == 404


# ============================================================
# Stage - Read
# ============================================================

def test_list_stages(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(client, test_data, organization_id)

    create_stage(
        client, test_data, organization_id,
        pipeline["id"], name="New Lead", position=1,
    )
    create_stage(
        client, test_data, organization_id,
        pipeline["id"], name="Qualified", position=2,
    )

    response = client.get(
        f"/pipelines/{pipeline['id']}/stages/",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200

    body = response.json()

    assert body["total"] == 2
    assert len(body["items"]) == 2
    assert body["items"][0]["position"] == 1
    assert body["items"][1]["position"] == 2


def test_list_stages_pagination(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(client, test_data, organization_id)

    for position in range(1, 4):
        create_stage(
            client,
            test_data,
            organization_id,
            pipeline["id"],
            position=position,
        )

    response = client.get(
        f"/pipelines/{pipeline['id']}/stages/?page=1&limit=2",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200

    body = response.json()

    assert len(body["items"]) == 2
    assert body["total"] == 3
    assert body["page"] == 1
    assert body["limit"] == 2


@pytest.mark.parametrize(
    "params",
    [
        "page=0",
        "limit=0",
        "limit=101",
    ],
)
def test_list_stages_invalid_pagination(
    pipeline_context,
    test_data,
    params,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(client, test_data, organization_id)

    response = client.get(
        f"/pipelines/{pipeline['id']}/stages/?{params}",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 422


def test_list_stages_for_nonexistent_pipeline_returns_404(
    pipeline_context,
):
    response = pipeline_context["client"].get(
        "/pipelines/pipelines:nonexistent/stages/",
        headers={
            "X-Organization-ID": pipeline_context["organization_id"],
        },
    )

    assert response.status_code == 404


def test_get_stage_success(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(client, test_data, organization_id)

    stage = create_stage(
        client,
        test_data,
        organization_id,
        pipeline["id"],
    )

    response = client.get(
        f"/pipelines/{pipeline['id']}/stages/{stage['id']}",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200
    assert response.json()["id"] == stage["id"]


def test_get_nonexistent_stage_returns_404(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(client, test_data, organization_id)

    response = client.get(
        f"/pipelines/{pipeline['id']}/stages/stages:nonexistent",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 404


# ============================================================
# Stage - Update
# ============================================================

def test_update_stage_success(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(client, test_data, organization_id)

    stage = create_stage(
        client,
        test_data,
        organization_id,
        pipeline["id"],
        name="New Lead",
        position=1,
        probability=10,
    )

    response = client.put(
        f"/pipelines/{pipeline['id']}/stages/{stage['id']}",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": "Qualified",
            "position": 2,
            "probability": 50,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["name"] == "Qualified"
    assert body["position"] == 2
    assert body["probability"] == 50


def test_update_stage_duplicate_name_returns_409(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(client, test_data, organization_id)

    first = create_stage(
        client, test_data, organization_id,
        pipeline["id"], name="New Lead", position=1,
    )

    second = create_stage(
        client, test_data, organization_id,
        pipeline["id"], name="Qualified", position=2,
    )

    response = client.put(
        f"/pipelines/{pipeline['id']}/stages/{second['id']}",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": "New Lead",
            "position": 3,
            "probability": 50,
        },
    )

    assert response.status_code == 409


def test_update_stage_duplicate_position_returns_409(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(client, test_data, organization_id)

    create_stage(
        client, test_data, organization_id,
        pipeline["id"], name="New Lead", position=1,
    )

    second = create_stage(
        client, test_data, organization_id,
        pipeline["id"], name="Qualified", position=2,
    )

    response = client.put(
        f"/pipelines/{pipeline['id']}/stages/{second['id']}",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": "Qualified",
            "position": 1,
            "probability": 50,
        },
    )

    assert response.status_code == 409


def test_update_stage_invalid_probability_returns_422(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(client, test_data, organization_id)

    stage = create_stage(
        client,
        test_data,
        organization_id,
        pipeline["id"],
    )

    response = client.put(
        f"/pipelines/{pipeline['id']}/stages/{stage['id']}",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": "Updated Stage",
            "position": 2,
            "probability": 101,
        },
    )

    assert response.status_code == 422


def test_update_nonexistent_stage_returns_404(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(client, test_data, organization_id)

    response = client.put(
        f"/pipelines/{pipeline['id']}/stages/stages:nonexistent",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": "Updated Stage",
            "position": 1,
            "probability": 50,
        },
    )

    assert response.status_code == 404


# ============================================================
# Stage - Delete
# ============================================================

def test_delete_stage_success(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(client, test_data, organization_id)

    stage = create_stage(
        client,
        test_data,
        organization_id,
        pipeline["id"],
    )

    response = client.delete(
        f"/pipelines/{pipeline['id']}/stages/{stage['id']}",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Stage deleted successfully"

    get_response = client.get(
        f"/pipelines/{pipeline['id']}/stages/{stage['id']}",
        headers={"X-Organization-ID": organization_id},
    )

    assert get_response.status_code == 404


def test_delete_stage_used_by_deal_returns_409(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(client, test_data, organization_id)

    stage = create_stage(
        client,
        test_data,
        organization_id,
        pipeline["id"],
    )

    create_deal(
        client,
        test_data,
        organization_id,
        stage["id"],
    )

    response = client.delete(
        f"/pipelines/{pipeline['id']}/stages/{stage['id']}",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 409


def test_delete_nonexistent_stage_returns_404(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(client, test_data, organization_id)

    response = client.delete(
        f"/pipelines/{pipeline['id']}/stages/stages:nonexistent",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 404


# ============================================================
# RBAC
# ============================================================

def test_admin_can_create_pipeline(
    pipeline_context,
    test_data,
):
    client = pipeline_context["login_as"]("ADMIN")

    response = client.post(
        "/pipelines/",
        headers={
            "X-Organization-ID": pipeline_context["organization_id"],
        },
        json={
            "name": "Admin Pipeline",
            "description": None,
            "is_default": False,
        },
    )

    assert response.status_code == 201
    test_data["pipelines"].append(response.json()["id"])


def test_manager_can_create_pipeline(
    pipeline_context,
    test_data,
):
    client = pipeline_context["login_as"]("MANAGER")

    response = client.post(
        "/pipelines/",
        headers={
            "X-Organization-ID": pipeline_context["organization_id"],
        },
        json={
            "name": "Manager Pipeline",
            "description": None,
            "is_default": False,
        },
    )

    assert response.status_code == 201
    test_data["pipelines"].append(response.json()["id"])


def test_sales_cannot_create_pipeline(
    pipeline_context,
):
    client = pipeline_context["login_as"]("SALES")

    response = client.post(
        "/pipelines/",
        headers={
            "X-Organization-ID": pipeline_context["organization_id"],
        },
        json={
            "name": "Sales Pipeline",
            "description": None,
            "is_default": False,
        },
    )

    assert response.status_code == 403


def test_sales_can_list_pipelines(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    create_pipeline(client, test_data, organization_id)

    client = pipeline_context["login_as"]("SALES")

    response = client.get(
        "/pipelines/",
        headers={"X-Organization-ID": organization_id},
    )

    assert response.status_code == 200


def test_sales_cannot_create_stage(
    pipeline_context,
    test_data,
):
    client = pipeline_context["client"]
    organization_id = pipeline_context["organization_id"]

    pipeline = create_pipeline(client, test_data, organization_id)

    client = pipeline_context["login_as"]("SALES")

    response = client.post(
        f"/pipelines/{pipeline['id']}/stages/",
        headers={"X-Organization-ID": organization_id},
        json={
            "name": "Sales Stage",
            "position": 1,
            "probability": 10,
        },
    )

    assert response.status_code == 403


# ============================================================
# Organization Isolation
# ============================================================

def test_pipeline_is_isolated_between_organizations(
    organization_isolation_context,
    test_data,
):
    client = organization_isolation_context["client"]
    organization_a_id = organization_isolation_context["organization_a_id"]
    organization_b_id = organization_isolation_context["organization_b_id"]

    # Create a pipeline in Organization A.
    client = organization_isolation_context["authorization"]["login_as"](
        "ADMIN"
    )

    pipeline = create_pipeline(
        client,
        test_data,
        organization_a_id,
    )

    # Switch to Organization B's owner.
    outsider = organization_isolation_context["outsider"]

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
        f"/pipelines/{pipeline['id']}",
        headers={"X-Organization-ID": organization_b_id},
    )

    assert response.status_code == 404


def test_stage_is_isolated_between_organizations(
    organization_isolation_context,
    test_data,
):
    client = organization_isolation_context["authorization"]["login_as"](
        "ADMIN"
    )

    organization_a_id = organization_isolation_context["organization_a_id"]
    organization_b_id = organization_isolation_context["organization_b_id"]

    pipeline = create_pipeline(
        client,
        test_data,
        organization_a_id,
    )

    stage = create_stage(
        client,
        test_data,
        organization_a_id,
        pipeline["id"],
    )

    outsider = organization_isolation_context["outsider"]

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
        f"/pipelines/{pipeline['id']}/stages/{stage['id']}",
        headers={"X-Organization-ID": organization_b_id},
    )

    assert response.status_code == 404
