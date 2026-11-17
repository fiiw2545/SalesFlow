import apiClient from "../../../api/client";
import endpoints from "../../../api/endpoints";

import type {
  StoredFile,
  FileListResponse,
  FileDeleteResponse,
  AvatarDeleteResponse,
} from "../types/file.types";

export async function uploadFile(file: File): Promise<StoredFile> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<StoredFile>(
    endpoints.files.upload,
    formData,
    {
      // ให้ Axios/Browser กำหนด multipart boundary เอง
      headers: {
        "Content-Type": undefined,
      },
    },
  );

  return response.data;
}

export async function getFiles(
  limit = 20,
  offset = 0,
): Promise<FileListResponse> {
  const response = await apiClient.get<FileListResponse>(endpoints.files.list, {
    params: { limit, offset },
  });

  return response.data;
}

export async function getFile(id: string): Promise<StoredFile> {
  const response = await apiClient.get<StoredFile>(endpoints.files.detail(id));

  return response.data;
}

export async function downloadFile(id: string): Promise<Blob> {
  const response = await apiClient.get<Blob>(endpoints.files.download(id), {
    responseType: "blob",
  });

  return response.data;
}

export async function deleteFile(id: string): Promise<FileDeleteResponse> {
  const response = await apiClient.delete<FileDeleteResponse>(
    endpoints.files.delete(id),
  );

  return response.data;
}

export async function uploadAvatar(file: File): Promise<StoredFile> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<StoredFile>(
    endpoints.files.avatar.upload,
    formData,
    {
      headers: {
        "Content-Type": undefined,
      },
    },
  );

  return response.data;
}

export async function downloadAvatar(id: string): Promise<Blob> {
  const response = await apiClient.get<Blob>(
    endpoints.files.avatar.download(id),
    {
      responseType: "blob",
    },
  );

  return response.data;
}

export async function removeAvatar(): Promise<AvatarDeleteResponse> {
  const response = await apiClient.delete<AvatarDeleteResponse>(
    endpoints.files.avatar.delete,
  );

  return response.data;
}
