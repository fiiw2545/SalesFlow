import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  getTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
} from "../services/tag.service";

import type { TagPayload } from "../types/tag.types";

export function useTags(page = 1, limit = 10) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["tags", activeOrganization?.id, page, limit],
    queryFn: () => getTags(page, limit),
    enabled: isReady && !!activeOrganization,
  });
}

export function useTag(id: string) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["tags", activeOrganization?.id, id],
    queryFn: () => getTag(id),
    enabled: isReady && !!activeOrganization && !!id,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TagPayload) => createTag(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TagPayload }) =>
      updateTag(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}
