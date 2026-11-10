import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  getPipelines,
  getPipeline,
  createPipeline,
  updatePipeline,
  deletePipeline,
} from "../services/pipeline.service";

import type { PipelinePayload } from "../types/pipeline.types";

export function usePipelines(page = 1, limit = 10) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["pipelines", activeOrganization?.id, page, limit],
    queryFn: () => getPipelines(page, limit),
    enabled: isReady && !!activeOrganization,
  });
}

export function usePipeline(id: string) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["pipelines", activeOrganization?.id, id],
    queryFn: () => getPipeline(id),
    enabled: isReady && !!activeOrganization && !!id,
  });
}

export function useCreatePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PipelinePayload) => createPipeline(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pipelines"],
      });
    },
  });
}

export function useUpdatePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PipelinePayload }) =>
      updatePipeline(id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pipelines"],
      });
    },
  });
}

export function useDeletePipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePipeline(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pipelines"],
      });
    },
  });
}
