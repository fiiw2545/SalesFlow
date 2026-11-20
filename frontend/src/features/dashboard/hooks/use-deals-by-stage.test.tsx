import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { getDealsByStage } from "../services/dashboard.service";
import { useOrganization } from "../../organizations/context/organization.context";
import { useDealsByStage } from "./use-deals-by-stage";

vi.mock("../services/dashboard.service", () => ({
  getDealsByStage: vi.fn(),
}));

vi.mock("../../organizations/context/organization.context", () => ({
  useOrganization: vi.fn(),
}));

const dateRange = {
  startDate: "2026-11-01",
  endDate: "2026-11-19",
};

const mockDealsByStage = {
  items: [
    {
      stage_id: "stage-1",
      stage_name: "New Lead",
      count: 5,
      total_value: 25000,
    },
    {
      stage_id: "stage-2",
      stage_name: "Qualified",
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

describe("useDealsByStage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    vi.mocked(getDealsByStage).mockResolvedValue(mockDealsByStage);
  });

  it("should fetch deals by stage successfully", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDealsByStage(dateRange), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockDealsByStage);
  });

  it("should use the correct query key", () => {
    const { queryClient, wrapper } = createWrapper();

    renderHook(() => useDealsByStage(dateRange), { wrapper });

    const query = queryClient.getQueryCache().find({
      queryKey: [
        "dashboard",
        "deals-by-stage",
        "org-123",
        dateRange.startDate,
        dateRange.endDate,
      ],
    });

    expect(query).toBeDefined();
  });

  it("should pass date range and AbortSignal to service", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDealsByStage(dateRange), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getDealsByStage).toHaveBeenCalledWith(
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

    renderHook(() => useDealsByStage(dateRange), { wrapper });

    expect(getDealsByStage).not.toHaveBeenCalled();
  });

  it("should not fetch when there is no active organization", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: null,
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    const { wrapper } = createWrapper();

    renderHook(() => useDealsByStage(dateRange), { wrapper });

    expect(getDealsByStage).not.toHaveBeenCalled();
  });

  it("should not fetch when organization is not ready and unavailable", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: null,
      isReady: false,
    } as ReturnType<typeof useOrganization>);

    const { wrapper } = createWrapper();

    renderHook(() => useDealsByStage(dateRange), { wrapper });

    expect(getDealsByStage).not.toHaveBeenCalled();
  });

  it("should handle service errors", async () => {
    vi.mocked(getDealsByStage).mockRejectedValue(
      new Error("Failed to fetch deals by stage"),
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDealsByStage(dateRange), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(
      new Error("Failed to fetch deals by stage"),
    );
  });

  it("should be loading while the request is pending", () => {
    vi.mocked(getDealsByStage).mockReturnValue(new Promise(() => {}));

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDealsByStage(dateRange), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);
  });
});
