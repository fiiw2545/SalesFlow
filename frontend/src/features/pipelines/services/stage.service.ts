import apiClient from "../../../api/client";
import endpoints from "../../../api/endpoints";

import type {
  Stage,
  StagePayload,
  StageDeleteResponse,
  StageListResponse,
} from "../types/stage.types";

export async function getStages(
  pipelineId: string,
  page = 1,
  limit = 10,
): Promise<StageListResponse> {
  const response = await apiClient.get<StageListResponse>(
    endpoints.pipelines.stages.list(pipelineId),
    {
      params: { page, limit },
    },
  );

  return response.data;
}

export async function getStage(
  pipelineId: string,
  stageId: string,
): Promise<Stage> {
  const response = await apiClient.get<Stage>(
    endpoints.pipelines.stages.detail(pipelineId, stageId),
  );

  return response.data;
}

export async function createStage(
  pipelineId: string,
  payload: StagePayload,
): Promise<Stage> {
  const response = await apiClient.post<Stage>(
    endpoints.pipelines.stages.create(pipelineId),
    payload,
  );

  return response.data;
}

export async function updateStage(
  pipelineId: string,
  stageId: string,
  payload: StagePayload,
): Promise<Stage> {
  const response = await apiClient.put<Stage>(
    endpoints.pipelines.stages.update(pipelineId, stageId),
    payload,
  );

  return response.data;
}

export async function deleteStage(
  pipelineId: string,
  stageId: string,
): Promise<StageDeleteResponse> {
  const response = await apiClient.delete<StageDeleteResponse>(
    endpoints.pipelines.stages.delete(pipelineId, stageId),
  );

  return response.data;
}
