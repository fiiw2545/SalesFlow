import apiClient from "../../../api/client";
import endpoints from "../../../api/endpoints";

import type {
  Deal,
  DealCreatePayload,
  DealUpdatePayload,
  DealDeleteResponse,
  DealListResponse,
} from "../types/deal.types";

function toRecordId(
  table: "stages" | "companies" | "contacts",
  id: string | null | undefined,
): string | null {
  if (!id) return null;

  if (id.startsWith(`${table}:`)) {
    return id;
  }

  return `${table}:${id}`;
}

function normalizePayload<T extends DealCreatePayload | DealUpdatePayload>(
  payload: T,
): T {
  return {
    ...payload,
    stage_id: toRecordId("stages", payload.stage_id)!,
    company_id: toRecordId("companies", payload.company_id),
    contact_id: toRecordId("contacts", payload.contact_id),
  };
}

export async function getDeals(
  page = 1,
  limit = 10,
  search = "",
): Promise<DealListResponse> {
  const response = await apiClient.get<DealListResponse>(endpoints.deals.list, {
    params: {
      page,
      limit,
      search: search || undefined,
    },
  });

  return response.data;
}

export async function getDeal(id: string): Promise<Deal> {
  const response = await apiClient.get<Deal>(endpoints.deals.detail(id));

  return response.data;
}

export async function createDeal(payload: DealCreatePayload): Promise<Deal> {
  const response = await apiClient.post<Deal>(
    endpoints.deals.create,
    normalizePayload(payload),
  );

  return response.data;
}

export async function updateDeal(
  id: string,
  payload: DealUpdatePayload,
): Promise<Deal> {
  const response = await apiClient.put<Deal>(
    endpoints.deals.update(id),
    normalizePayload(payload),
  );

  return response.data;
}

export async function deleteDeal(id: string): Promise<DealDeleteResponse> {
  const response = await apiClient.delete<DealDeleteResponse>(
    endpoints.deals.delete(id),
  );

  return response.data;
}
