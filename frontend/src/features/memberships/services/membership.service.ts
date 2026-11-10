import apiClient from "../../../api/client";
import endpoints from "../../../api/endpoints";

import type {
  MembershipCreatePayload,
  MembershipDeleteResponse,
  MembershipListResponse,
  Membership,
  MembershipUpdatePayload,
} from "../types/membership.types";

export async function getMemberships(
  page = 1,
  limit = 10,
): Promise<MembershipListResponse> {
  const response = await apiClient.get<MembershipListResponse>(
    endpoints.memberships.list,
    {
      params: { page, limit },
    },
  );

  return response.data;
}

export async function createMembership(
  payload: MembershipCreatePayload,
): Promise<Membership> {
  const response = await apiClient.post<Membership>(
    endpoints.memberships.create,
    payload,
  );

  return response.data;
}

export async function updateMembership(
  id: string,
  payload: MembershipUpdatePayload,
): Promise<Membership> {
  const response = await apiClient.patch<Membership>(
    endpoints.memberships.update(id),
    payload,
  );

  return response.data;
}

export async function deleteMembership(
  id: string,
): Promise<MembershipDeleteResponse> {
  const response = await apiClient.delete<MembershipDeleteResponse>(
    endpoints.memberships.delete(id),
  );

  return response.data;
}
