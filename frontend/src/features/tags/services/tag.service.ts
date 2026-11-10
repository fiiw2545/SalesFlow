import apiClient from "../../../api/client";
import endpoints from "../../../api/endpoints";

import type {
  Tag,
  TagPayload,
  TagDeleteResponse,
  TagListResponse,
} from "../types/tag.types";

export async function getTags(page = 1, limit = 10): Promise<TagListResponse> {
  const response = await apiClient.get<TagListResponse>(endpoints.tags.list, {
    params: { page, limit },
  });

  return response.data;
}

export async function getTag(id: string): Promise<Tag> {
  const response = await apiClient.get<Tag>(endpoints.tags.detail(id));
  return response.data;
}

export async function createTag(payload: TagPayload): Promise<Tag> {
  const response = await apiClient.post<Tag>(endpoints.tags.create, payload);

  return response.data;
}

export async function updateTag(id: string, payload: TagPayload): Promise<Tag> {
  const response = await apiClient.put<Tag>(endpoints.tags.update(id), payload);

  return response.data;
}

export async function deleteTag(id: string): Promise<TagDeleteResponse> {
  const response = await apiClient.delete<TagDeleteResponse>(
    endpoints.tags.delete(id),
  );

  return response.data;
}
