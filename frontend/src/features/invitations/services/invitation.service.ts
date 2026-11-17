import apiClient from "../../../api/client";
import endpoints from "../../../api/endpoints";

import type {
  InvitationListResponse,
  InvitationAcceptPayload,
  InvitationAcceptResponse,
  InvitationCreatePayload,
  InvitationCreateResponse,
  InvitationRevokeResponse,
  InvitationValidateResponse,
} from "../types/invitation.types";

export async function getInvitations(): Promise<InvitationListResponse> {
  const response = await apiClient.get<InvitationListResponse>(
    endpoints.invitations.list,
  );

  return response.data;
}

export async function createInvitation(
  payload: InvitationCreatePayload,
): Promise<InvitationCreateResponse> {
  const response = await apiClient.post<InvitationCreateResponse>(
    endpoints.invitations.create,
    payload,
  );

  return response.data;
}

export async function validateInvitation(
  token: string,
): Promise<InvitationValidateResponse> {
  const response = await apiClient.get<InvitationValidateResponse>(
    endpoints.invitations.validate(token),
  );

  return response.data;
}

export async function acceptInvitation(
  payload: InvitationAcceptPayload,
): Promise<InvitationAcceptResponse> {
  const response = await apiClient.post<InvitationAcceptResponse>(
    endpoints.invitations.accept,
    payload,
  );

  return response.data;
}

export async function revokeInvitation(
  id: string,
): Promise<InvitationRevokeResponse> {
  const response = await apiClient.post<InvitationRevokeResponse>(
    endpoints.invitations.revoke(id),
  );

  return response.data;
}
