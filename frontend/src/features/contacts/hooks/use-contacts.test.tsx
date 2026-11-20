import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
} from "../services/contact.service";

import {
  useContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from "./use-contacts";

import type {
  Contact,
  ContactPayload,
  ContactListResponse,
} from "../types/contact.types";

vi.mock("../services/contact.service", () => ({
  getContacts: vi.fn(),
  createContact: vi.fn(),
  updateContact: vi.fn(),
  deleteContact: vi.fn(),
  getContactTags: vi.fn(),
  assignContactTag: vi.fn(),
  unassignContactTag: vi.fn(),
}));

vi.mock("../../organizations/context/organization.context", () => ({
  useOrganization: vi.fn(),
}));

const mockContact: Contact = {
  id: "contact-123",
  name: "John Doe",
  email: "john@example.com",
  phone: "0812345678",
  age: 30,
  company_id: "company-123",
  position: "Manager",
  created_at: "2026-11-19T10:00:00",
};

const mockContactList: ContactListResponse = {
  data: [mockContact],
  total: 1,
  page: 1,
  limit: 10,
  total_pages: 1,
};

const mockPayload: ContactPayload = {
  name: "John Doe",
  email: "john@example.com",
  phone: "0812345678",
  age: 30,
  company_id: "company-123",
  position: "Manager",
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

describe("useContacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    vi.mocked(getContacts).mockResolvedValue(mockContactList);
  });

  it("should fetch contacts successfully", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useContacts(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockContactList);
    expect(getContacts).toHaveBeenCalledWith(1, 10, "");
  });

  it("should use custom page, limit, and search", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useContacts(2, 20, "John"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getContacts).toHaveBeenCalledWith(2, 20, "John");
  });

  it("should use the correct query key", () => {
    const { queryClient, wrapper } = createWrapper();

    renderHook(() => useContacts(2, 20, "John"), { wrapper });

    const query = queryClient.getQueryCache().find({
      queryKey: ["contacts", "org-123", 2, 20, "John"],
    });

    expect(query).toBeDefined();
  });

  it("should not fetch when organization is not ready", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: false,
    } as ReturnType<typeof useOrganization>);

    const { wrapper } = createWrapper();
    renderHook(() => useContacts(), { wrapper });

    expect(getContacts).not.toHaveBeenCalled();
  });

  it("should not fetch without an active organization", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: null,
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    const { wrapper } = createWrapper();
    renderHook(() => useContacts(), { wrapper });

    expect(getContacts).not.toHaveBeenCalled();
  });
});

describe("useCreateContact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createContact).mockResolvedValue(mockContact);
  });

  it("should create a contact successfully", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateContact(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(mockPayload);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockContact);
    });

    expect(createContact).toHaveBeenCalledWith(mockPayload);
  });

  it("should invalidate contacts queries after successful creation", async () => {
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateContact(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(mockPayload);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["contacts"],
    });
  });

  it("should handle creation errors", async () => {
    vi.mocked(createContact).mockRejectedValue(
      new Error("Failed to create contact"),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateContact(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync(mockPayload)).rejects.toThrow(
        "Failed to create contact",
      );
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useUpdateContact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateContact).mockResolvedValue(mockContact);
  });

  it("should update a contact successfully", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateContact(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: "contact-123",
        payload: mockPayload,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockContact);
    });

    expect(updateContact).toHaveBeenCalledWith("contact-123", mockPayload);
  });

  it("should invalidate contacts queries after successful update", async () => {
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateContact(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: "contact-123",
        payload: mockPayload,
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["contacts"],
    });
  });

  it("should handle update errors", async () => {
    vi.mocked(updateContact).mockRejectedValue(
      new Error("Failed to update contact"),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateContact(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          id: "contact-123",
          payload: mockPayload,
        }),
      ).rejects.toThrow("Failed to update contact");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useDeleteContact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deleteContact).mockResolvedValue(undefined);
  });

  it("should delete a contact successfully", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteContact(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("contact-123");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    expect(deleteContact).toHaveBeenCalledWith(
      "contact-123",
      expect.objectContaining({
        client: expect.any(Object),
      }),
    );
  });

  it("should invalidate contacts queries after successful deletion", async () => {
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteContact(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("contact-123");
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["contacts"],
    });
  });

  it("should handle deletion errors", async () => {
    vi.mocked(deleteContact).mockRejectedValue(
      new Error("Failed to delete contact"),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteContact(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync("contact-123")).rejects.toThrow(
        "Failed to delete contact",
      );
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
