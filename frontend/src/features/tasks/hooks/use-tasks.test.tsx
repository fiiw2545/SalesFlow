import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from "../services/task.service";

import {
  useTasks,
  useTask,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from "./use-tasks";

import type {
  Task,
  TaskPayload,
  TaskListResponse,
  TaskDeleteResponse,
} from "../types/task.types";

const {
  useOrganizationMock,
  getTasksMock,
  getTaskMock,
  createTaskMock,
  updateTaskMock,
  deleteTaskMock,
} = vi.hoisted(() => ({
  useOrganizationMock: vi.fn(),
  getTasksMock: vi.fn(),
  getTaskMock: vi.fn(),
  createTaskMock: vi.fn(),
  updateTaskMock: vi.fn(),
  deleteTaskMock: vi.fn(),
}));

vi.mock("../../organizations/context/organization.context", () => ({
  useOrganization: useOrganizationMock,
}));

vi.mock("../services/task.service", () => ({
  getTasks: getTasksMock,
  getTask: getTaskMock,
  createTask: createTaskMock,
  updateTask: updateTaskMock,
  deleteTask: deleteTaskMock,
}));

const mockTask: Task = {
  id: "task-123",
  title: "Follow up with customer",
  description: "Contact the customer about the proposal",
  due_date: "2026-12-01T10:00:00Z",
  priority: "HIGH",
  status: "PENDING",
  completed_at: null,
  deal_id: "deals:deal-123",
  contact_id: "contacts:contact-123",
  assigned_to: "user-123",
  organization_id: "org-123",
  created_at: "2026-01-01T10:00:00Z",
  updated_at: null,
};

const mockTaskList: TaskListResponse = {
  items: [mockTask],
  total: 1,
  page: 1,
  limit: 10,
  total_pages: 1,
};

const mockPayload: TaskPayload = {
  title: "Follow up with customer",
  description: "Contact the customer about the proposal",
  due_date: "2026-12-01T10:00:00Z",
  priority: "HIGH",
  status: "PENDING",
  deal_id: "deals:deal-123",
  contact_id: "contacts:contact-123",
};

const mockDeleteResponse: TaskDeleteResponse = {
  message: "Task deleted successfully",
};

function createWrapper(
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
) {
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe("Tasks Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useOrganizationMock.mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: true,
    });
  });

  // useTasks
  describe("useTasks", () => {
    it("should fetch tasks successfully", async () => {
      getTasksMock.mockResolvedValue(mockTaskList);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockTaskList);
      });

      expect(getTasks).toHaveBeenCalledWith(1, 10);
    });

    it("should use organization ID, page and limit in query key", async () => {
      getTasksMock.mockResolvedValue(mockTaskList);

      const { queryClient, wrapper } = createWrapper();

      renderHook(() => useTasks(2, 25), { wrapper });

      await waitFor(() => {
        expect(getTasks).toHaveBeenCalledWith(2, 25);
      });

      expect(
        queryClient.getQueryCache().find({
          queryKey: ["tasks", "org-123", 2, 25],
        }),
      ).toBeDefined();
    });

    it("should not fetch when organization is not ready", () => {
      useOrganizationMock.mockReturnValue({
        activeOrganization: { id: "org-123" },
        isReady: false,
      });

      const { wrapper } = createWrapper();

      renderHook(() => useTasks(), { wrapper });

      expect(getTasks).not.toHaveBeenCalled();
    });

    it("should not fetch when there is no active organization", () => {
      useOrganizationMock.mockReturnValue({
        activeOrganization: null,
        isReady: true,
      });

      const { wrapper } = createWrapper();

      renderHook(() => useTasks(), { wrapper });

      expect(getTasks).not.toHaveBeenCalled();
    });
  });

  // useTask
  describe("useTask", () => {
    it("should fetch a task successfully", async () => {
      getTaskMock.mockResolvedValue(mockTask);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useTask("task-123"), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockTask);
      });

      expect(getTask).toHaveBeenCalledWith("task-123");
    });

    it("should use organization ID and task ID in query key", async () => {
      getTaskMock.mockResolvedValue(mockTask);

      const { queryClient, wrapper } = createWrapper();

      renderHook(() => useTask("task-123"), { wrapper });

      await waitFor(() => {
        expect(getTask).toHaveBeenCalledWith("task-123");
      });

      expect(
        queryClient.getQueryCache().find({
          queryKey: ["tasks", "org-123", "task-123"],
        }),
      ).toBeDefined();
    });

    it("should not fetch when organization is not ready", () => {
      useOrganizationMock.mockReturnValue({
        activeOrganization: { id: "org-123" },
        isReady: false,
      });

      const { wrapper } = createWrapper();

      renderHook(() => useTask("task-123"), { wrapper });

      expect(getTask).not.toHaveBeenCalled();
    });

    it("should not fetch when there is no active organization", () => {
      useOrganizationMock.mockReturnValue({
        activeOrganization: null,
        isReady: true,
      });

      const { wrapper } = createWrapper();

      renderHook(() => useTask("task-123"), { wrapper });

      expect(getTask).not.toHaveBeenCalled();
    });

    it("should not fetch when task ID is empty", () => {
      const { wrapper } = createWrapper();

      renderHook(() => useTask(""), { wrapper });

      expect(getTask).not.toHaveBeenCalled();
    });
  });

  // useCreateTask
  describe("useCreateTask", () => {
    it("should create a task successfully", async () => {
      createTaskMock.mockResolvedValue(mockTask);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateTask(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(mockPayload);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(createTask).toHaveBeenCalledWith(mockPayload);
      expect(result.current.data).toEqual(mockTask);
    });

    it("should invalidate task queries after success", async () => {
      createTaskMock.mockResolvedValue(mockTask);

      const { queryClient, wrapper } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateTask(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(mockPayload);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["tasks"],
      });
    });

    it("should handle create errors", async () => {
      createTaskMock.mockRejectedValue(new Error("Create failed"));

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateTask(), { wrapper });

      await act(async () => {
        await expect(result.current.mutateAsync(mockPayload)).rejects.toThrow(
          "Create failed",
        );
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  // useUpdateTask
  describe("useUpdateTask", () => {
    it("should update a task successfully", async () => {
      updateTaskMock.mockResolvedValue(mockTask);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateTask(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: "task-123",
          payload: mockPayload,
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(updateTask).toHaveBeenCalledWith("task-123", mockPayload);
      expect(result.current.data).toEqual(mockTask);
    });

    it("should invalidate task queries after success", async () => {
      updateTaskMock.mockResolvedValue(mockTask);

      const { queryClient, wrapper } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useUpdateTask(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: "task-123",
          payload: mockPayload,
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["tasks"],
      });
    });

    it("should handle update errors", async () => {
      updateTaskMock.mockRejectedValue(new Error("Update failed"));

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateTask(), { wrapper });

      await act(async () => {
        await expect(
          result.current.mutateAsync({
            id: "task-123",
            payload: mockPayload,
          }),
        ).rejects.toThrow("Update failed");
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  // useDeleteTask
  describe("useDeleteTask", () => {
    it("should delete a task successfully", async () => {
      deleteTaskMock.mockResolvedValue(mockDeleteResponse);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteTask(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync("task-123");
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(deleteTask).toHaveBeenCalledWith("task-123");
      expect(result.current.data).toEqual(mockDeleteResponse);
    });

    it("should invalidate task queries after success", async () => {
      deleteTaskMock.mockResolvedValue(mockDeleteResponse);

      const { queryClient, wrapper } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteTask(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync("task-123");
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["tasks"],
      });
    });

    it("should handle delete errors", async () => {
      deleteTaskMock.mockRejectedValue(new Error("Delete failed"));

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteTask(), { wrapper });

      await act(async () => {
        await expect(result.current.mutateAsync("task-123")).rejects.toThrow(
          "Delete failed",
        );
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
