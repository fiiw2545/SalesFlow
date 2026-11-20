import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import apiClient from "../../../api/client";
import {
  setActiveOrganizationId,
  clearActiveOrganizationId,
} from "../../organizations/stores/organization.store";

import { useGlobalSearch } from "./use-global-search";

import type { SearchResponse } from "../types/search.types";

vi.mock("../../../api/client", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockSearchResponse: SearchResponse = {
  query: "Acme",
  companies: [
    {
      type: "company",
      id: "company-123",
      title: "Acme Corporation",
      subtitle: "Technology",
      href: "/companies/company-123",
    },
  ],
  contacts: [],
  deals: [],
  total: 1,
};

function createWrapper(
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
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

describe("Global Search Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearActiveOrganizationId();
  });

  it("should fetch search results successfully", async () => {
    setActiveOrganizationId("org-123");

    vi.mocked(apiClient.get).mockResolvedValue({
      data: mockSearchResponse,
    });

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGlobalSearch("Acme", true), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockSearchResponse);
    });

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(expect.any(String), {
      params: { q: "Acme" },
    });
  });

  it("should use organization ID and query in query key", async () => {
    setActiveOrganizationId("org-123");

    vi.mocked(apiClient.get).mockResolvedValue({
      data: mockSearchResponse,
    });

    const { queryClient, wrapper } = createWrapper();

    renderHook(() => useGlobalSearch("Acme", true), { wrapper });

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });

    expect(
      queryClient.getQueryCache().find({
        queryKey: ["global-search", "org-123", "Acme"],
      }),
    ).toBeDefined();
  });

  it("should not fetch when enabled is false", () => {
    setActiveOrganizationId("org-123");

    const { wrapper } = createWrapper();

    renderHook(() => useGlobalSearch("Acme", false), { wrapper });

    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("should not fetch when query has less than 2 characters", () => {
    setActiveOrganizationId("org-123");

    const { wrapper } = createWrapper();

    renderHook(() => useGlobalSearch("A", true), { wrapper });

    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("should not fetch when query is empty", () => {
    setActiveOrganizationId("org-123");

    const { wrapper } = createWrapper();

    renderHook(() => useGlobalSearch("", true), { wrapper });

    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("should not fetch when query contains only whitespace", () => {
    setActiveOrganizationId("org-123");

    const { wrapper } = createWrapper();

    renderHook(() => useGlobalSearch("   ", true), { wrapper });

    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("should not fetch when there is no active organization", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useGlobalSearch("Acme", true), { wrapper });

    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("should allow fetching when query has exactly 2 characters", async () => {
    setActiveOrganizationId("org-123");

    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        ...mockSearchResponse,
        query: "AB",
      },
    });

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useGlobalSearch("AB", true), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith(expect.any(String), {
      params: { q: "AB" },
    });
  });

  it("should use a stale time of 30 seconds", async () => {
    setActiveOrganizationId("org-123");

    vi.mocked(apiClient.get).mockResolvedValue({
      data: mockSearchResponse,
    });

    const { queryClient, wrapper } = createWrapper();

    renderHook(() => useGlobalSearch("Acme", true), { wrapper });

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });

    const query = queryClient.getQueryCache().find({
      queryKey: ["global-search", "org-123", "Acme"],
    });

    const options = query?.options as { staleTime?: number };

    expect(options.staleTime).toBe(30 * 1000);
  });

  it("should retry once when the request fails", async () => {
    setActiveOrganizationId("org-123");

    vi.mocked(apiClient.get)
      .mockRejectedValueOnce(new Error("Network error"))
      .mockRejectedValueOnce(new Error("Network error"));

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retryDelay: 0,
        },
      },
    });

    const { wrapper } = createWrapper(queryClient);

    const { result } = renderHook(() => useGlobalSearch("Acme", true), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });
});
