import apiClient from "../../../api/client";
import endpoints from "../../../api/endpoints";

import type {
  OrganizationCreatePayload,
  OrganizationCreateResponse,
  OrganizationDeleteResponse,
  OrganizationListResponse,
  OrganizationResponse,
  OrganizationUpdatePayload,
} from "../types/organization.types";

export async function getOrganizations(
  page = 1,
  limit = 100,
): Promise<OrganizationListResponse> {
  const response = await apiClient.get<OrganizationListResponse>(
    endpoints.organizations.list,
    {
      params: { page, limit },
    },
  );

  return response.data;
}

export async function createOrganization(
  payload: OrganizationCreatePayload,
): Promise<OrganizationCreateResponse> {
  const response = await apiClient.post<OrganizationCreateResponse>(
    endpoints.organizations.create,
    payload,
  );

  return response.data;
}

export async function updateOrganization(
  id: string,
  payload: OrganizationUpdatePayload,
): Promise<OrganizationResponse> {
  const response = await apiClient.put<OrganizationResponse>(
    endpoints.organizations.update(id),
    payload,
  );

  return response.data;
}

export async function deactivateOrganization(
  id: string,
): Promise<OrganizationDeleteResponse> {
  const response = await apiClient.delete<OrganizationDeleteResponse>(
    endpoints.organizations.delete(id),
  );

  return response.data;
}
