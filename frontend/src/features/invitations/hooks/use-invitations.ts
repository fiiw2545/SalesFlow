import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  acceptInvitation,
  createInvitation,
  getInvitations,
  revokeInvitation,
  validateInvitation,
} from "../services/invitation.service";

import type {
  InvitationAcceptPayload,
  InvitationCreatePayload,
} from "../types/invitation.types";

const INVITATIONS_QUERY_KEY = "invitations";

export function useInvitations(organizationId?: string) {
  return useQuery({
    queryKey: [INVITATIONS_QUERY_KEY, organizationId],
    queryFn: getInvitations,
    enabled: Boolean(organizationId),
  });
}

export function useValidateInvitation(token: string) {
  return useQuery({
    queryKey: [INVITATIONS_QUERY_KEY, "validate", token],
    queryFn: () => validateInvitation(token),
    enabled: Boolean(token),
    retry: false,
    staleTime: 0,
  });
}

export function useCreateInvitation(organizationId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InvitationCreatePayload) => createInvitation(payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [INVITATIONS_QUERY_KEY, organizationId],
      });
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: InvitationAcceptPayload) => acceptInvitation(payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["auth", "me"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["organizations", "all"],
      });

      await queryClient.invalidateQueries({
        queryKey: [INVITATIONS_QUERY_KEY],
      });
    },
  });
}

export function useRevokeInvitation(organizationId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => revokeInvitation(id),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [INVITATIONS_QUERY_KEY, organizationId],
      });
    },
  });
}
