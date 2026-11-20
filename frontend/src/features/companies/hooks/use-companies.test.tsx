import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from "../services/company.service";

import {
  useCompanies,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
} from "./use-companies";

import type {
  Company,
  CompanyPayload,
  CompanyListResponse,
  CompanyDeleteResponse,
} from "../types/company.types";

vi.mock("../services/company.service", () => ({
  getCompanies: vi.fn(),
  createCompany: vi.fn(),
  updateCompany: vi.fn(),
  deleteCompany: vi.fn(),
}));

vi.mock("../../organizations/context/organization.context", () => ({
  useOrganization: vi.fn(),
}));

const mockCompany: Company = {
  id: "company-123",
  name: "ABC Company",
  address: "Bangkok",
  industry: "Technology",
  phone: "0812345678",
  website: "https://abc.com",
  logo_file_id: null,
  created_by: "user-123",
  organization_id: "org-123",
  created_at: "2026-11-19T10:00:00",
  updated_at: null,
};

const mockCompanyList: CompanyListResponse = {
  items: [mockCompany],
  total: 1,
  page: 1,
  limit: 10,
  total_pages: 1,
};

const mockPayload: CompanyPayload = {
  name: "ABC Company",
  address: "Bangkok",
  industry: "Technology",
  phone: "0812345678",
  website: "https://abc.com",
};

const mockDeleteResponse: CompanyDeleteResponse = {
  message: "Company deleted successfully",
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

describe("useCompanies", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    vi.mocked(getCompanies).mockResolvedValue(mockCompanyList);
  });

  it("should fetch companies successfully", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCompanies(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockCompanyList);
    expect(getCompanies).toHaveBeenCalledWith(1, 10, "");
  });

  it("should use custom page, limit, and search", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCompanies(2, 20, "ABC"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getCompanies).toHaveBeenCalledWith(2, 20, "ABC");
  });

  it("should use the correct query key", () => {
    const { queryClient, wrapper } = createWrapper();

    renderHook(() => useCompanies(2, 20, "ABC"), { wrapper });

    const query = queryClient.getQueryCache().find({
      queryKey: ["companies", "org-123", 2, 20, "ABC"],
    });

    expect(query).toBeDefined();
  });

  it("should not fetch when organization is not ready", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: false,
    } as ReturnType<typeof useOrganization>);

    const { wrapper } = createWrapper();
    renderHook(() => useCompanies(), { wrapper });

    expect(getCompanies).not.toHaveBeenCalled();
  });

  it("should not fetch without an active organization", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: null,
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    const { wrapper } = createWrapper();
    renderHook(() => useCompanies(), { wrapper });

    expect(getCompanies).not.toHaveBeenCalled();
  });
});

describe("useCreateCompany", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createCompany).mockResolvedValue(mockCompany);
  });

  it("should create a company successfully", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCompany(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(mockPayload);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockCompany);
    });

    expect(createCompany).toHaveBeenCalledWith(mockPayload);
  });

  it("should invalidate companies queries after successful creation", async () => {
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateCompany(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(mockPayload);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["companies"],
    });
  });

  it("should handle creation errors", async () => {
    vi.mocked(createCompany).mockRejectedValue(
      new Error("Failed to create company"),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCompany(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync(mockPayload)).rejects.toThrow(
        "Failed to create company",
      );
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useUpdateCompany", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateCompany).mockResolvedValue(mockCompany);
  });

  it("should update a company successfully", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateCompany(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: "company-123",
        payload: { name: "Updated Company" },
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockCompany);
    });

    expect(updateCompany).toHaveBeenCalledWith("company-123", {
      name: "Updated Company",
    });
  });

  it("should invalidate companies queries after successful update", async () => {
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateCompany(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: "company-123",
        payload: { name: "Updated Company" },
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["companies"],
    });
  });

  it("should handle update errors", async () => {
    vi.mocked(updateCompany).mockRejectedValue(
      new Error("Failed to update company"),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateCompany(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          id: "company-123",
          payload: { name: "Updated Company" },
        }),
      ).rejects.toThrow("Failed to update company");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useDeleteCompany", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deleteCompany).mockResolvedValue(mockDeleteResponse);
  });

  it("should delete a company successfully", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteCompany(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("company-123");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockDeleteResponse);
    });

    expect(deleteCompany).toHaveBeenCalledWith("company-123");
  });

  it("should invalidate companies queries after successful deletion", async () => {
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteCompany(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("company-123");
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["companies"],
    });
  });

  it("should handle deletion errors", async () => {
    vi.mocked(deleteCompany).mockRejectedValue(
      new Error("Failed to delete company"),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteCompany(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync("company-123")).rejects.toThrow(
        "Failed to delete company",
      );
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
