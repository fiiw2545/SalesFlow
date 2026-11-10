import apiClient from "../../../api/client";
import endpoints from "../../../api/endpoints";

import type {
  Pipeline,
  PipelinePayload,
  PipelineDeleteResponse,
  PipelineListResponse,
} from "../types/pipeline.types";

export async function getPipelines(
  page = 1,
  limit = 10,
): Promise<PipelineListResponse> {
  const response = await apiClient.get<PipelineListResponse>(
    endpoints.pipelines.list,
    {
      params: { page, limit },
    },
  );

  return response.data;
}

export async function getPipeline(id: string): Promise<Pipeline> {
  const response = await apiClient.get<Pipeline>(
    endpoints.pipelines.detail(id),
  );

  return response.data;
}

export async function createPipeline(
  payload: PipelinePayload,
): Promise<Pipeline> {
  const response = await apiClient.post<Pipeline>(
    endpoints.pipelines.create,
    payload,
  );

  return response.data;
}

export async function updatePipeline(
  id: string,
  payload: PipelinePayload,
): Promise<Pipeline> {
  const response = await apiClient.put<Pipeline>(
    endpoints.pipelines.update(id),
    payload,
  );

  return response.data;
}

export async function deletePipeline(
  id: string,
): Promise<PipelineDeleteResponse> {
  const response = await apiClient.delete<PipelineDeleteResponse>(
    endpoints.pipelines.delete(id),
  );

  return response.data;
}
