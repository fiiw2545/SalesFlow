import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createMembership,
  deleteMembership,
  getMemberships,
  updateMembership,
} from "../services/membership.service";

import type {
  MembershipCreatePayload,
  MembershipRole,
} from "../types/membership.types";

const MEMBERSHIPS_QUERY_KEY = "memberships";

export function useMemberships(organizationId?: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: [MEMBERSHIPS_QUERY_KEY, organizationId, page, limit],
    queryFn: () => getMemberships(page, limit),
    enabled: Boolean(organizationId),
  });
}

export function useCreateMembership(organizationId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MembershipCreatePayload) => createMembership(payload),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [MEMBERSHIPS_QUERY_KEY, organizationId],
      }),
  });
}

export function useUpdateMembership(organizationId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: MembershipRole }) =>
      updateMembership(id, { role }),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [MEMBERSHIPS_QUERY_KEY, organizationId],
      }),
  });
}

export function useDeleteMembership(organizationId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMembership(id),

    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [MEMBERSHIPS_QUERY_KEY, organizationId],
      }),
  });
}
