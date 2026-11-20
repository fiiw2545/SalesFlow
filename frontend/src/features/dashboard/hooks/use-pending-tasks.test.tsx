import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { getTasks } from "../../tasks/services/task.service";
import { useOrganization } from "../../organizations/context/organization.context";
import { usePendingTasks } from "./use-pending-tasks";
import type { Task, TaskListResponse } from "../../tasks/types/task.types";

vi.mock("../../tasks/services/task.service", () => ({
  getTasks: vi.fn(),
}));

vi.mock("../../organizations/context/organization.context", () => ({
  useOrganization: vi.fn(),
}));

function createTask(
  id: string,
  status: Task["status"],
  dueDate: string | null,
): Task {
  return {
    id,
    title: `Task ${id}`,
    description: null,
    due_date: dueDate,
    priority: "MEDIUM",
    status,
    completed_at: null,
    deal_id: null,
    contact_id: null,
    assigned_to: "user-123",
    organization_id: "org-123",
    created_at: "2026-11-01T10:00:00",
    updated_at: null,
  };
}

const mockTasks: Task[] = [
  createTask("1", "PENDING", "2026-11-10T10:00:00"),
  createTask("2", "IN_PROGRESS", "2026-11-05T10:00:00"),
  createTask("3", "COMPLETED", "2026-11-03T10:00:00"),
  createTask("4", "CANCELLED", "2026-11-02T10:00:00"),
  createTask("5", "PENDING", null),
  createTask("6", "IN_PROGRESS", "2026-11-07T10:00:00"),
  createTask("7", "PENDING", "2026-11-04T10:00:00"),
  createTask("8", "PENDING", "2026-11-06T10:00:00"),
];

const mockResponse: TaskListResponse = {
  items: mockTasks,
  total: mockTasks.length,
  page: 1,
  limit: 10,
  total_pages: 1,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe("usePendingTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    vi.mocked(getTasks).mockResolvedValue(mockResponse);
  });

  it("should fetch pending tasks successfully", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePendingTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(5);
  });

  it("should call getTasks with page 1, limit 10 and AbortSignal", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePendingTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getTasks).toHaveBeenCalledWith(1, 10, expect.any(AbortSignal));
  });

  it("should use the correct query key", () => {
    const { queryClient, wrapper } = createWrapper();

    renderHook(() => usePendingTasks(), { wrapper });

    const query = queryClient.getQueryCache().find({
      queryKey: ["dashboard", "pending-tasks", "org-123"],
    });

    expect(query).toBeDefined();
  });

  it("should only return PENDING and IN_PROGRESS tasks", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePendingTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(
      result.current.data?.every(
        (task) => task.status === "PENDING" || task.status === "IN_PROGRESS",
      ),
    ).toBe(true);

    expect(
      result.current.data?.some((task) => task.status === "COMPLETED"),
    ).toBe(false);

    expect(
      result.current.data?.some((task) => task.status === "CANCELLED"),
    ).toBe(false);
  });

  it("should sort tasks by due date ascending", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePendingTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.map((task) => task.id)).toEqual([
      "7",
      "2",
      "8",
      "6",
      "1",
    ]);
  });

  it("should put tasks without due date at the end", async () => {
    const response: TaskListResponse = {
      ...mockResponse,
      items: [
        createTask("1", "PENDING", null),
        createTask("2", "IN_PROGRESS", "2026-11-05T10:00:00"),
        createTask("3", "PENDING", null),
      ],
    };

    vi.mocked(getTasks).mockResolvedValue(response);

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePendingTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.map((task) => task.id)).toEqual([
      "2",
      "1",
      "3",
    ]);
  });

  it("should return at most five tasks", async () => {
    const response: TaskListResponse = {
      ...mockResponse,
      items: Array.from({ length: 8 }, (_, index) =>
        createTask(
          String(index + 1),
          "PENDING",
          `2026-11-${String(index + 1).padStart(2, "0")}T10:00:00`,
        ),
      ),
    };

    vi.mocked(getTasks).mockResolvedValue(response);

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePendingTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(5);
  });

  it("should return an empty array when there are no pending tasks", async () => {
    const response: TaskListResponse = {
      ...mockResponse,
      items: [
        createTask("1", "COMPLETED", "2026-11-01T10:00:00"),
        createTask("2", "CANCELLED", "2026-11-02T10:00:00"),
      ],
    };

    vi.mocked(getTasks).mockResolvedValue(response);

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePendingTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it("should not fetch when organization is not ready", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: false,
    } as ReturnType<typeof useOrganization>);

    const { wrapper } = createWrapper();

    renderHook(() => usePendingTasks(), { wrapper });

    expect(getTasks).not.toHaveBeenCalled();
  });

  it("should not fetch when there is no active organization", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: null,
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    const { wrapper } = createWrapper();

    renderHook(() => usePendingTasks(), { wrapper });

    expect(getTasks).not.toHaveBeenCalled();
  });

  it("should handle service errors", async () => {
    vi.mocked(getTasks).mockRejectedValue(new Error("Failed to fetch tasks"));

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePendingTasks(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(new Error("Failed to fetch tasks"));
  });

  it("should be loading while the request is pending", () => {
    vi.mocked(getTasks).mockReturnValue(new Promise(() => {}));

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePendingTasks(), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });
});
