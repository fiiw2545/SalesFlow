import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
} from "../services/deal.service";

import {
  useDeals,
  useDeal,
  useCreateDeal,
  useUpdateDeal,
  useDeleteDeal,
} from "./use-deals";

import type {
  Deal,
  DealCreatePayload,
  DealUpdatePayload,
  DealListResponse,
  DealDeleteResponse,
} from "../types/deal.types";

vi.mock("../../organizations/context/organization.context", () => ({
  useOrganization: vi.fn(),
}));

vi.mock("../services/deal.service", () => ({
  getDeals: vi.fn(),
  getDeal: vi.fn(),
  createDeal: vi.fn(),
  updateDeal: vi.fn(),
  deleteDeal: vi.fn(),
}));

const mockDeal: Deal = {
  id: "deal-123",
  title: "Test Deal",
  value: 50000,
  currency: "THB",
  status: "OPEN",
  stage_id: "stages:stage-123",
  company_id: "companies:company-123",
  contact_id: "contacts:contact-123",
  expected_close_date: "2026-12-31",
  organization_id: "org-123",
  owner_id: "user-123",
  created_at: "2026-11-01T10:00:00Z",
  updated_at: null,
};

const mockDealList: DealListResponse = {
  items: [mockDeal],
  total: 1,
  page: 1,
  limit: 10,
  total_pages: 1,
};

const mockCreatePayload: DealCreatePayload = {
  title: "New Deal",
  value: 75000,
  currency: "THB",
  stage_id: "stage-456",
  company_id: "company-456",
  contact_id: "contact-456",
  expected_close_date: "2026-12-31",
};

const mockUpdatePayload: DealUpdatePayload = {
  title: "Updated Deal",
  value: 90000,
  currency: "THB",
  status: "WON",
  stage_id: "stage-789",
  company_id: "company-789",
  contact_id: "contact-789",
  expected_close_date: "2027-01-31",
};

const mockDeleteResponse: DealDeleteResponse = {
  message: "Deal deleted successfully",
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

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function mockOrganization(
  activeOrganization: { id: string } | null = { id: "org-123" },
  isReady = true,
) {
  vi.mocked(useOrganization).mockReturnValue({
    activeOrganization,
    isReady,
  } as ReturnType<typeof useOrganization>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockOrganization();
});

describe("useDeals", () => {
  it("should fetch deals successfully", async () => {
    vi.mocked(getDeals).mockResolvedValue(mockDealList);

    const { result } = renderHook(() => useDeals(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockDealList);
    expect(getDeals).toHaveBeenCalledWith(1, 10, "");
  });

  it("should use custom page, limit, and search", async () => {
    vi.mocked(getDeals).mockResolvedValue(mockDealList);

    const { result } = renderHook(() => useDeals(2, 20, "Enterprise"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getDeals).toHaveBeenCalledWith(2, 20, "Enterprise");
  });

  it("should use the correct query key", async () => {
    vi.mocked(getDeals).mockResolvedValue(mockDealList);

    const { result } = renderHook(() => useDeals(2, 20, "Enterprise"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockDealList);
  });

  it("should not fetch when organization is not ready", () => {
    mockOrganization({ id: "org-123" }, false);

    renderHook(() => useDeals(), {
      wrapper: createWrapper(),
    });

    expect(getDeals).not.toHaveBeenCalled();
  });

  it("should not fetch without an active organization", () => {
    mockOrganization(null, true);

    renderHook(() => useDeals(), {
      wrapper: createWrapper(),
    });

    expect(getDeals).not.toHaveBeenCalled();
  });
});

describe("useDeal", () => {
  it("should fetch a single deal successfully", async () => {
    vi.mocked(getDeal).mockResolvedValue(mockDeal);

    const { result } = renderHook(() => useDeal("deal-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockDeal);
    expect(getDeal).toHaveBeenCalledWith("deal-123");
  });

  it("should use the correct query key", async () => {
    vi.mocked(getDeal).mockResolvedValue(mockDeal);

    const { result } = renderHook(() => useDeal("deal-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.id).toBe("deal-123");
  });

  it("should not fetch when deal ID is empty", () => {
    renderHook(() => useDeal(""), {
      wrapper: createWrapper(),
    });

    expect(getDeal).not.toHaveBeenCalled();
  });

  it("should not fetch without an active organization", () => {
    mockOrganization(null, true);

    renderHook(() => useDeal("deal-123"), {
      wrapper: createWrapper(),
    });

    expect(getDeal).not.toHaveBeenCalled();
  });

  it("should not fetch when organization is not ready", () => {
    mockOrganization({ id: "org-123" }, false);

    renderHook(() => useDeal("deal-123"), {
      wrapper: createWrapper(),
    });

    expect(getDeal).not.toHaveBeenCalled();
  });
});

describe("useCreateDeal", () => {
  it("should create a deal successfully", async () => {
    vi.mocked(createDeal).mockResolvedValue(mockDeal);

    const { result } = renderHook(() => useCreateDeal(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(mockCreatePayload);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(createDeal).toHaveBeenCalledWith(mockCreatePayload);
    expect(result.current.data).toEqual(mockDeal);
  });

  it("should invalidate deals queries after successful creation", async () => {
    vi.mocked(createDeal).mockResolvedValue(mockDeal);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useCreateDeal(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(mockCreatePayload);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["deals"],
    });
  });

  it("should handle creation errors", async () => {
    vi.mocked(createDeal).mockRejectedValue(new Error("Create failed"));

    const { result } = renderHook(() => useCreateDeal(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync(mockCreatePayload),
      ).rejects.toThrow("Create failed");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useUpdateDeal", () => {
  it("should update a deal successfully", async () => {
    vi.mocked(updateDeal).mockResolvedValue(mockDeal);

    const { result } = renderHook(() => useUpdateDeal(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: "deal-123",
        payload: mockUpdatePayload,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(updateDeal).toHaveBeenCalledWith("deal-123", mockUpdatePayload);
    expect(result.current.data).toEqual(mockDeal);
  });

  it("should invalidate deals queries after successful update", async () => {
    vi.mocked(updateDeal).mockResolvedValue(mockDeal);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useUpdateDeal(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: "deal-123",
        payload: mockUpdatePayload,
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["deals"],
    });
  });

  it("should handle update errors", async () => {
    vi.mocked(updateDeal).mockRejectedValue(new Error("Update failed"));

    const { result } = renderHook(() => useUpdateDeal(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          id: "deal-123",
          payload: mockUpdatePayload,
        }),
      ).rejects.toThrow("Update failed");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useDeleteDeal", () => {
  it("should delete a deal successfully", async () => {
    vi.mocked(deleteDeal).mockResolvedValue(mockDeleteResponse);

    const { result } = renderHook(() => useDeleteDeal(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync("deal-123");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(deleteDeal).toHaveBeenCalledWith("deal-123");
    expect(result.current.data).toEqual(mockDeleteResponse);
  });

  it("should invalidate deals queries after successful deletion", async () => {
    vi.mocked(deleteDeal).mockResolvedValue(mockDeleteResponse);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useDeleteDeal(), {
      wrapper: Wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync("deal-123");
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["deals"],
    });
  });

  it("should handle deletion errors", async () => {
    vi.mocked(deleteDeal).mockRejectedValue(new Error("Delete failed"));

    const { result } = renderHook(() => useDeleteDeal(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await expect(result.current.mutateAsync("deal-123")).rejects.toThrow(
        "Delete failed",
      );
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
