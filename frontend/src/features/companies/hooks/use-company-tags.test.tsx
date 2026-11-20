import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  getCompanyTags,
  assignCompanyTag,
  unassignCompanyTag,
} from "../services/company.service";

import {
  useCompanyTags,
  useAssignCompanyTag,
  useUnassignCompanyTag,
} from "./use-company-tags";

import type {
  CompanyTagAssignment,
  CompanyTagAssignmentPayload,
  CompanyTagDeleteResponse,
} from "../types/company.types";

vi.mock("../services/company.service", () => ({
  getCompanyTags: vi.fn(),
  assignCompanyTag: vi.fn(),
  unassignCompanyTag: vi.fn(),
}));

vi.mock("../../organizations/context/organization.context", () => ({
  useOrganization: vi.fn(),
}));

const mockCompanyTag: CompanyTagAssignment = {
  id: "company-tags:assignment-123",
  organization_id: "org-123",
  tag_id: "tag-123",
  created_at: "2026-11-19T10:00:00",
};

const mockCompanyTags: CompanyTagAssignment[] = [mockCompanyTag];

const mockPayload: CompanyTagAssignmentPayload = {
  tag_id: "tag-123",
};

const mockDeleteResponse: CompanyTagDeleteResponse = {
  message: "Company tag removed successfully",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe("useCompanyTags", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    vi.mocked(getCompanyTags).mockResolvedValue(mockCompanyTags);
  });

  it("should fetch company tags successfully", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCompanyTags("company-123"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockCompanyTags);
    expect(getCompanyTags).toHaveBeenCalledWith("company-123");
  });

  it("should use the correct query key", () => {
    const { queryClient, wrapper } = createWrapper();

    renderHook(() => useCompanyTags("company-123"), { wrapper });

    const query = queryClient.getQueryCache().find({
      queryKey: ["company-tags", "org-123", "company-123"],
    });

    expect(query).toBeDefined();
  });

  it("should not fetch when company ID is empty", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useCompanyTags(""), { wrapper });

    expect(getCompanyTags).not.toHaveBeenCalled();
  });

  it("should not fetch when organization is not ready", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: false,
    } as ReturnType<typeof useOrganization>);

    const { wrapper } = createWrapper();

    renderHook(() => useCompanyTags("company-123"), { wrapper });

    expect(getCompanyTags).not.toHaveBeenCalled();
  });

  it("should not fetch without an active organization", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: null,
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    const { wrapper } = createWrapper();

    renderHook(() => useCompanyTags("company-123"), { wrapper });

    expect(getCompanyTags).not.toHaveBeenCalled();
  });
});

describe("useAssignCompanyTag", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    vi.mocked(assignCompanyTag).mockResolvedValue(mockCompanyTag);
  });

  it("should assign a tag to a company successfully", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAssignCompanyTag(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        companyId: "company-123",
        payload: mockPayload,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockCompanyTag);
    });

    expect(assignCompanyTag).toHaveBeenCalledWith("company-123", mockPayload);
  });

  it("should invalidate the corresponding company tags query", async () => {
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAssignCompanyTag(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        companyId: "company-123",
        payload: mockPayload,
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["company-tags", "org-123", "company-123"],
    });
  });

  it("should handle assignment errors", async () => {
    vi.mocked(assignCompanyTag).mockRejectedValue(
      new Error("Failed to assign company tag"),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAssignCompanyTag(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          companyId: "company-123",
          payload: mockPayload,
        }),
      ).rejects.toThrow("Failed to assign company tag");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useUnassignCompanyTag", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    vi.mocked(unassignCompanyTag).mockResolvedValue(mockDeleteResponse);
  });

  it("should unassign a tag from a company successfully", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUnassignCompanyTag(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        companyId: "company-123",
        tagId: "tag-123",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockDeleteResponse);
    });

    expect(unassignCompanyTag).toHaveBeenCalledWith("company-123", "tag-123");
  });

  it("should invalidate the corresponding company tags query", async () => {
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUnassignCompanyTag(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        companyId: "company-123",
        tagId: "tag-123",
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["company-tags", "org-123", "company-123"],
    });
  });

  it("should handle unassignment errors", async () => {
    vi.mocked(unassignCompanyTag).mockRejectedValue(
      new Error("Failed to unassign company tag"),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUnassignCompanyTag(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          companyId: "company-123",
          tagId: "tag-123",
        }),
      ).rejects.toThrow("Failed to unassign company tag");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
