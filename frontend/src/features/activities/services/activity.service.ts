import apiClient from "../../../api/client";
import endpoints from "../../../api/endpoints";

import type {
  Activity,
  ActivityPayload,
  ActivityListResponse,
  ActivityDeleteResponse,
} from "../types/activity.types";

function toRecordId(
  table: "deals" | "contacts",
  id: string | null,
): string | null {
  if (!id) return null;

  if (id.startsWith(`${table}:`)) return id;

  return `${table}:${id}`;
}

function normalizePayload(payload: ActivityPayload): ActivityPayload {
  return {
    ...payload,
    deal_id: toRecordId("deals", payload.deal_id),
    contact_id: toRecordId("contacts", payload.contact_id),
  };
}

export async function getActivities(
  page = 1,
  limit = 10,
): Promise<ActivityListResponse> {
  const response = await apiClient.get<ActivityListResponse>(
    endpoints.activities.list,
    {
      params: { page, limit },
    },
  );

  return response.data;
}

export async function getActivity(id: string): Promise<Activity> {
  const response = await apiClient.get<Activity>(
    endpoints.activities.detail(id),
  );

  return response.data;
}

export async function createActivity(
  payload: ActivityPayload,
): Promise<Activity> {
  const response = await apiClient.post<Activity>(
    endpoints.activities.create,
    normalizePayload(payload),
  );

  return response.data;
}

export async function updateActivity(
  id: string,
  payload: ActivityPayload,
): Promise<Activity> {
  const response = await apiClient.put<Activity>(
    endpoints.activities.update(id),
    normalizePayload(payload),
  );

  return response.data;
}

export async function deleteActivity(
  id: string,
): Promise<ActivityDeleteResponse> {
  const response = await apiClient.delete<ActivityDeleteResponse>(
    endpoints.activities.delete(id),
  );

  return response.data;
}
