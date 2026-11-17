import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  getFiles,
  getFile,
  uploadFile,
  downloadFile,
  deleteFile,
} from "../services/file.service";

export function useFiles(limit = 20, offset = 0) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["files", activeOrganization?.id, limit, offset],
    queryFn: () => getFiles(limit, offset),
    enabled: isReady && !!activeOrganization,
  });
}

export function useFile(id: string) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["files", activeOrganization?.id, id],
    queryFn: () => getFile(id),
    enabled: isReady && !!activeOrganization && !!id,
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadFile(file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["files"],
      });
    },
  });
}

export function useDownloadFile() {
  return useMutation({
    mutationFn: (id: string) => downloadFile(id),
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["files"],
      });
    },
  });
}
