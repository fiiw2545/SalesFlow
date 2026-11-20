import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { getDealsByStatus } from "../services/dashboard.service";
import { useOrganization } from "../../organizations/context/organization.context";
import { useDealsByStatus } from "./use-deals-by-status";

vi.mock("../services/dashboard.service", () => ({
  getDealsByStatus: vi.fn(),
}));

vi.mock("../../organizations/context/organization.context", () => ({
  useOrganization: vi.fn(),
}));

const dateRange = {
  startDate: "2026-11-01",
  endDate: "2026-11-19",
};

const mockDealsByStatus = {
  items: [
    {
      status: "OPEN",
      count: 5,
      total_value: 25000,
    },
    {
      status: "WON",
      count: 3,
      total_value: 15000,
    },
  ],
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

describe("useDealsByStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    vi.mocked(getDealsByStatus).mockResolvedValue(mockDealsByStatus);
  });

  it("should fetch deals by status successfully", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDealsByStatus(dateRange), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockDealsByStatus);
  });

  it("should use the correct query key", () => {
    const { queryClient, wrapper } = createWrapper();

    renderHook(() => useDealsByStatus(dateRange), { wrapper });

    const query = queryClient.getQueryCache().find({
      queryKey: [
        "dashboard",
        "deals-by-status",
        "org-123",
        dateRange.startDate,
        dateRange.endDate,
      ],
    });

    expect(query).toBeDefined();
  });

  it("should pass date range and AbortSignal to service", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDealsByStatus(dateRange), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getDealsByStatus).toHaveBeenCalledWith(
      dateRange,
      expect.any(AbortSignal),
    );
  });

  it("should not fetch when organization is not ready", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: false,
    } as ReturnType<typeof useOrganization>);

    const { wrapper } = createWrapper();

    renderHook(() => useDealsByStatus(dateRange), { wrapper });

    expect(getDealsByStatus).not.toHaveBeenCalled();
  });

  it("should not fetch when there is no active organization", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: null,
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    const { wrapper } = createWrapper();

    renderHook(() => useDealsByStatus(dateRange), { wrapper });

    expect(getDealsByStatus).not.toHaveBeenCalled();
  });

  it("should not fetch when organization is not ready and unavailable", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: null,
      isReady: false,
    } as ReturnType<typeof useOrganization>);

    const { wrapper } = createWrapper();

    renderHook(() => useDealsByStatus(dateRange), { wrapper });

    expect(getDealsByStatus).not.toHaveBeenCalled();
  });

  it("should handle service errors", async () => {
    vi.mocked(getDealsByStatus).mockRejectedValue(
      new Error("Failed to fetch deals by status"),
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDealsByStatus(dateRange), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(
      new Error("Failed to fetch deals by status"),
    );
  });

  it("should be loading while the request is pending", () => {
    vi.mocked(getDealsByStatus).mockReturnValue(new Promise(() => {}));

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDealsByStatus(dateRange), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);
  });
});
