import { type ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDashboardSummary } from "./use-dashboard-summary";
import { getDashboardSummary } from "../services/dashboard.service";
import { useOrganization } from "../../organizations/context/organization.context";

vi.mock("../services/dashboard.service", () => ({
  getDashboardSummary: vi.fn(),
}));

vi.mock("../../organizations/context/organization.context", () => ({
  useOrganization: vi.fn(),
}));

const dateRange = {
  startDate: "2026-11-01",
  endDate: "2026-11-19",
};

const mockSummary = {
  total_deals: 10,
  total_deal_value: 50000,
  won_deals: 3,
  won_deal_value: 15000,
  open_deals: 5,
  pending_tasks: 4,
  overdue_tasks: 1,
  total_activities: 20,
};

const mockOrganization = {
  id: "org-123",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return { Wrapper, queryClient };
}

describe("useDashboardSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: mockOrganization,
      isReady: true,
    } as ReturnType<typeof useOrganization>);
  });

  it("fetches dashboard summary successfully", async () => {
    vi.mocked(getDashboardSummary).mockResolvedValue(
      mockSummary as Awaited<ReturnType<typeof getDashboardSummary>>,
    );

    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useDashboardSummary(dateRange), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockSummary);
    expect(getDashboardSummary).toHaveBeenCalledTimes(1);
    expect(getDashboardSummary).toHaveBeenCalledWith(
      dateRange,
      expect.any(AbortSignal),
    );
  });

  it("uses the correct query key", () => {
    vi.mocked(getDashboardSummary).mockResolvedValue(
      mockSummary as Awaited<ReturnType<typeof getDashboardSummary>>,
    );

    const { Wrapper, queryClient } = createWrapper();

    renderHook(() => useDashboardSummary(dateRange), {
      wrapper: Wrapper,
    });

    const query = queryClient.getQueryCache().find({
      queryKey: ["dashboard", "summary", "org-123", "2026-11-01", "2026-11-19"],
    });

    expect(query).toBeDefined();
  });

  it("passes the selected date range to the service", async () => {
    vi.mocked(getDashboardSummary).mockResolvedValue(
      mockSummary as Awaited<ReturnType<typeof getDashboardSummary>>,
    );

    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useDashboardSummary(dateRange), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getDashboardSummary).toHaveBeenCalledWith(
      dateRange,
      expect.any(AbortSignal),
    );
  });

  it("does not fetch when organization is not ready", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: mockOrganization,
      isReady: false,
    } as ReturnType<typeof useOrganization>);

    const { Wrapper } = createWrapper();

    renderHook(() => useDashboardSummary(dateRange), {
      wrapper: Wrapper,
    });

    expect(getDashboardSummary).not.toHaveBeenCalled();
  });

  it("does not fetch when there is no active organization", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: null,
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    const { Wrapper } = createWrapper();

    renderHook(() => useDashboardSummary(dateRange), {
      wrapper: Wrapper,
    });

    expect(getDashboardSummary).not.toHaveBeenCalled();
  });

  it("does not fetch when organization is not ready and has no active organization", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: null,
      isReady: false,
    } as ReturnType<typeof useOrganization>);

    const { Wrapper } = createWrapper();

    renderHook(() => useDashboardSummary(dateRange), {
      wrapper: Wrapper,
    });

    expect(getDashboardSummary).not.toHaveBeenCalled();
  });

  it("returns an error when the service request fails", async () => {
    const error = new Error("Failed to fetch dashboard summary");

    vi.mocked(getDashboardSummary).mockRejectedValue(error);

    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useDashboardSummary(dateRange), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });

  it("returns loading state while the request is pending", () => {
    vi.mocked(getDashboardSummary).mockReturnValue(new Promise(() => {}));

    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useDashboardSummary(dateRange), {
      wrapper: Wrapper,
    });

    expect(result.current.isLoading).toBe(true);
  });
});
