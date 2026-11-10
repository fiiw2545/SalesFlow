import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../services/activity.service";

import type { ActivityPayload } from "../types/activity.types";

export function useActivities(page = 1, limit = 10) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["activities", activeOrganization?.id, page, limit],
    queryFn: () => getActivities(page, limit),
    enabled: isReady && !!activeOrganization,
  });
}

export function useActivity(id: string) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["activities", activeOrganization?.id, id],
    queryFn: () => getActivity(id),
    enabled: isReady && !!activeOrganization && !!id,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ActivityPayload) => createActivity(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ActivityPayload }) =>
      updateActivity(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteActivity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
}
