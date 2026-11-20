import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../services/activity.service";

import {
  useActivities,
  useActivity,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
} from "./use-activities";

import type {
  Activity,
  ActivityPayload,
  ActivityListResponse,
  ActivityDeleteResponse,
} from "../types/activity.types";

vi.mock("../services/activity.service", () => ({
  getActivities: vi.fn(),
  getActivity: vi.fn(),
  createActivity: vi.fn(),
  updateActivity: vi.fn(),
  deleteActivity: vi.fn(),
}));

vi.mock("../../organizations/context/organization.context", () => ({
  useOrganization: vi.fn(),
}));

const mockActivity: Activity = {
  id: "activity-123",
  subject: "Follow up with customer",
  type: "CALL",
  description: "Discuss project requirements",
  deal_id: null,
  contact_id: null,
  organization_id: "org-123",
  performed_by: "user-123",
  created_at: "2026-11-19T10:00:00",
};

const mockActivityList: ActivityListResponse = {
  items: [mockActivity],
  total: 1,
  page: 1,
  limit: 10,
  total_pages: 1,
};

const mockPayload: ActivityPayload = {
  subject: "Follow up with customer",
  type: "CALL",
  description: "Discuss project requirements",
  deal_id: null,
  contact_id: null,
};

const mockDeleteResponse: ActivityDeleteResponse = {
  message: "Activity deleted successfully",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
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

describe("useActivities", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    vi.mocked(getActivities).mockResolvedValue(mockActivityList);
    vi.mocked(getActivity).mockResolvedValue(mockActivity);
    vi.mocked(createActivity).mockResolvedValue(mockActivity);
    vi.mocked(updateActivity).mockResolvedValue(mockActivity);
    vi.mocked(deleteActivity).mockResolvedValue(mockDeleteResponse);
  });

  it("should fetch activities successfully", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useActivities(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockActivityList);
    expect(getActivities).toHaveBeenCalledWith(1, 10);
  });

  it("should use custom page and limit", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useActivities(2, 20), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getActivities).toHaveBeenCalledWith(2, 20);
  });

  it("should use the correct query key", () => {
    const { queryClient, wrapper } = createWrapper();

    renderHook(() => useActivities(2, 20), { wrapper });

    const query = queryClient.getQueryCache().find({
      queryKey: ["activities", "org-123", 2, 20],
    });

    expect(query).toBeDefined();
  });

  it("should not fetch when organization is not ready", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: false,
    } as ReturnType<typeof useOrganization>);

    const { wrapper } = createWrapper();

    renderHook(() => useActivities(), { wrapper });

    expect(getActivities).not.toHaveBeenCalled();
  });

  it("should not fetch without an active organization", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: null,
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    const { wrapper } = createWrapper();

    renderHook(() => useActivities(), { wrapper });

    expect(getActivities).not.toHaveBeenCalled();
  });
});

describe("useActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    vi.mocked(getActivity).mockResolvedValue(mockActivity);
  });

  it("should fetch a single activity successfully", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useActivity("activity-123"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockActivity);
    expect(getActivity).toHaveBeenCalledWith("activity-123");
  });

  it("should use the correct query key", () => {
    const { queryClient, wrapper } = createWrapper();

    renderHook(() => useActivity("activity-123"), { wrapper });

    const query = queryClient.getQueryCache().find({
      queryKey: ["activities", "org-123", "activity-123"],
    });

    expect(query).toBeDefined();
  });

  it("should not fetch when activity ID is empty", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useActivity(""), { wrapper });

    expect(getActivity).not.toHaveBeenCalled();
  });

  it("should not fetch without an active organization", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: null,
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    const { wrapper } = createWrapper();

    renderHook(() => useActivity("activity-123"), { wrapper });

    expect(getActivity).not.toHaveBeenCalled();
  });

  it("should not fetch when organization is not ready", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: false,
    } as ReturnType<typeof useOrganization>);

    const { wrapper } = createWrapper();

    renderHook(() => useActivity("activity-123"), { wrapper });

    expect(getActivity).not.toHaveBeenCalled();
  });
});

describe("useCreateActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createActivity).mockResolvedValue(mockActivity);
  });

  it("should create an activity successfully", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateActivity(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(mockPayload);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockActivity);
    });

    expect(createActivity).toHaveBeenCalledWith(mockPayload);
  });

  it("should invalidate activities queries after successful creation", async () => {
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateActivity(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(mockPayload);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["activities"],
    });
  });

  it("should handle creation errors", async () => {
    vi.mocked(createActivity).mockRejectedValue(
      new Error("Failed to create activity"),
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateActivity(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync(mockPayload)).rejects.toThrow(
        "Failed to create activity",
      );
    });

    expect(result.current.isError).toBe(true);
  });
});

describe("useUpdateActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateActivity).mockResolvedValue(mockActivity);
  });

  it("should update an activity successfully", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUpdateActivity(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: "activity-123",
        payload: mockPayload,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockActivity);
    });

    expect(updateActivity).toHaveBeenCalledWith("activity-123", mockPayload);
  });

  it("should invalidate activities queries after successful update", async () => {
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateActivity(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: "activity-123",
        payload: mockPayload,
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["activities"],
    });
  });

  it("should handle update errors", async () => {
    vi.mocked(updateActivity).mockRejectedValue(
      new Error("Failed to update activity"),
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUpdateActivity(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          id: "activity-123",
          payload: mockPayload,
        }),
      ).rejects.toThrow("Failed to update activity");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useDeleteActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deleteActivity).mockResolvedValue(mockDeleteResponse);
  });

  it("should delete an activity successfully", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDeleteActivity(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("activity-123");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockDeleteResponse);
    });

    expect(deleteActivity).toHaveBeenCalledWith("activity-123");
  });

  it("should invalidate activities queries after successful deletion", async () => {
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteActivity(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("activity-123");
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["activities"],
    });
  });

  it("should handle deletion errors", async () => {
    vi.mocked(deleteActivity).mockRejectedValue(
      new Error("Failed to delete activity"),
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDeleteActivity(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync("activity-123")).rejects.toThrow(
        "Failed to delete activity",
      );
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
