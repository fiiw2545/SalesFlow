import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from "../services/task.service";

import type { TaskPayload } from "../types/task.types";

export function useTasks(page = 1, limit = 10) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["tasks", activeOrganization?.id, page, limit],
    queryFn: () => getTasks(page, limit),
    enabled: isReady && !!activeOrganization,
  });
}

export function useTask(id: string) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: ["tasks", activeOrganization?.id, id],
    queryFn: () => getTask(id),
    enabled: isReady && !!activeOrganization && !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TaskPayload) => createTask(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TaskPayload }) =>
      updateTask(id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });
    },
  });
}
