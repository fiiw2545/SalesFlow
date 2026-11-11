import apiClient from "../../../api/client";
import endpoints from "../../../api/endpoints";

import type {
  Task,
  TaskPayload,
  TaskListResponse,
  TaskDeleteResponse,
} from "../types/task.types";

function toRecordId(
  table: "deals" | "contacts",
  id: string | null,
): string | null {
  if (!id) return null;

  const recordId = id.includes(":") ? id.split(":").slice(1).join(":") : id;

  return `${table}:${recordId}`;
}

function normalizePayload(payload: TaskPayload): TaskPayload {
  return {
    ...payload,
    deal_id: toRecordId("deals", payload.deal_id),
    contact_id: toRecordId("contacts", payload.contact_id),
  };
}

export async function getTasks(
  page = 1,
  limit = 10,
  signal?: AbortSignal,
): Promise<TaskListResponse> {
  const response = await apiClient.get<TaskListResponse>(endpoints.tasks.list, {
    params: { page, limit },
    signal,
  });

  return response.data;
}

export async function getTask(id: string): Promise<Task> {
  const response = await apiClient.get<Task>(endpoints.tasks.detail(id));

  return response.data;
}

export async function createTask(payload: TaskPayload): Promise<Task> {
  const response = await apiClient.post<Task>(
    endpoints.tasks.create,
    normalizePayload(payload),
  );

  return response.data;
}

export async function updateTask(
  id: string,
  payload: TaskPayload,
): Promise<Task> {
  const response = await apiClient.put<Task>(
    endpoints.tasks.update(id),
    normalizePayload(payload),
  );

  return response.data;
}

export async function deleteTask(id: string): Promise<TaskDeleteResponse> {
  const response = await apiClient.delete<TaskDeleteResponse>(
    endpoints.tasks.delete(id),
  );

  return response.data;
}
