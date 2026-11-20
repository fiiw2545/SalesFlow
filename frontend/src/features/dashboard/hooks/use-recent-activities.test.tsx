import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { getActivities } from "../../activities/services/activity.service";
import { useOrganization } from "../../organizations/context/organization.context";
import { useRecentActivities } from "./use-recent-activities";
import type {
  Activity,
  ActivityListResponse,
} from "../../activities/types/activity.types";

vi.mock("../../activities/services/activity.service", () => ({
  getActivities: vi.fn(),
}));

vi.mock("../../organizations/context/organization.context", () => ({
  useOrganization: vi.fn(),
}));

function createActivity(id: string): Activity {
  return {
    id,
    subject: `Activity ${id}`,
    type: "CALL",
    description: null,
    deal_id: null,
    contact_id: null,
    organization_id: "org-123",
    performed_by: "user-123",
    created_at: "2026-11-19T10:00:00",
  };
}

const mockActivities = Array.from({ length: 8 }, (_, index) =>
  createActivity(String(index + 1)),
);

const mockResponse: ActivityListResponse = {
  items: mockActivities,
  total: mockActivities.length,
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

describe("useRecentActivities", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    vi.mocked(getActivities).mockResolvedValue(mockResponse);
  });

  it("should fetch recent activities successfully", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRecentActivities(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(5);
  });

  it("should call getActivities with page 1, limit 10 and AbortSignal", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRecentActivities(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getActivities).toHaveBeenCalledWith(1, 10, expect.any(AbortSignal));
  });

  it("should use the correct query key", () => {
    const { queryClient, wrapper } = createWrapper();

    renderHook(() => useRecentActivities(), { wrapper });

    const query = queryClient.getQueryCache().find({
      queryKey: ["dashboard", "recent-activities", "org-123"],
    });

    expect(query).toBeDefined();
  });

  it("should return only the first five activities", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRecentActivities(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.map((activity) => activity.id)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
  });

  it("should preserve the original activity order", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRecentActivities(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.[0].id).toBe("1");
    expect(result.current.data?.[1].id).toBe("2");
    expect(result.current.data?.[4].id).toBe("5");
  });

  it("should return all activities when fewer than five exist", async () => {
    const response: ActivityListResponse = {
      ...mockResponse,
      items: [createActivity("1"), createActivity("2")],
      total: 2,
    };

    vi.mocked(getActivities).mockResolvedValue(response);

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRecentActivities(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
  });

  it("should return an empty array when there are no activities", async () => {
    const response: ActivityListResponse = {
      ...mockResponse,
      items: [],
      total: 0,
    };

    vi.mocked(getActivities).mockResolvedValue(response);

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRecentActivities(), { wrapper });

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

    renderHook(() => useRecentActivities(), { wrapper });

    expect(getActivities).not.toHaveBeenCalled();
  });

  it("should not fetch when there is no active organization", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: null,
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    const { wrapper } = createWrapper();

    renderHook(() => useRecentActivities(), { wrapper });

    expect(getActivities).not.toHaveBeenCalled();
  });

  it("should handle service errors", async () => {
    vi.mocked(getActivities).mockRejectedValue(
      new Error("Failed to fetch activities"),
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRecentActivities(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(
      new Error("Failed to fetch activities"),
    );
  });

  it("should be loading while the request is pending", () => {
    vi.mocked(getActivities).mockReturnValue(new Promise(() => {}));

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRecentActivities(), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });
});
