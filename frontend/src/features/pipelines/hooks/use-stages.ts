import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  getStages,
  getStage,
  createStage,
  updateStage,
  deleteStage,
} from "../services/stage.service";

import type { StagePayload } from "../types/stage.types";

export function useStages(pipelineId: string, page = 1, limit = 10) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["stages", activeOrganization?.id, pipelineId, page, limit],
    queryFn: () => getStages(pipelineId, page, limit),
    enabled: isReady && !!activeOrganization && !!pipelineId,
  });
}

export function useStage(pipelineId: string, stageId: string) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["stages", activeOrganization?.id, pipelineId, stageId],
    queryFn: () => getStage(pipelineId, stageId),
    enabled: isReady && !!activeOrganization && !!pipelineId && !!stageId,
  });
}

export function useCreateStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pipelineId,
      payload,
    }: {
      pipelineId: string;
      payload: StagePayload;
    }) => createStage(pipelineId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stages"],
      });

      queryClient.invalidateQueries({
        queryKey: ["pipelines"],
      });
    },
  });
}

export function useUpdateStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pipelineId,
      stageId,
      payload,
    }: {
      pipelineId: string;
      stageId: string;
      payload: StagePayload;
    }) => updateStage(pipelineId, stageId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stages"],
      });
    },
  });
}

export function useDeleteStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pipelineId,
      stageId,
    }: {
      pipelineId: string;
      stageId: string;
    }) => deleteStage(pipelineId, stageId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["stages"],
      });
    },
  });
}
