import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  getContactTags,
  assignContactTag,
  unassignContactTag,
} from "../services/contact.service";

import {
  useContactTags,
  useAssignContactTag,
  useUnassignContactTag,
} from "./use-contact-tags";

import type {
  ContactTagAssignment,
  ContactTagAssignmentPayload,
  ContactTagDeleteResponse,
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

const mockContactTag: ContactTagAssignment = {
  id: "contact-tags:assignment-123",
  organization_id: "org-123",
  tag_id: "tag-123",
  created_at: "2026-11-19T10:00:00",
};

const mockContactTags: ContactTagAssignment[] = [mockContactTag];

const mockPayload: ContactTagAssignmentPayload = {
  tag_id: "tag-123",
};

const mockDeleteResponse: ContactTagDeleteResponse = {
  message: "Contact tag removed successfully",
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

describe("useContactTags", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    vi.mocked(getContactTags).mockResolvedValue(mockContactTags);
  });

  it("should fetch contact tags successfully", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useContactTags("contact-123"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockContactTags);
    expect(getContactTags).toHaveBeenCalledWith("contact-123");
  });

  it("should use the correct query key", () => {
    const { queryClient, wrapper } = createWrapper();

    renderHook(() => useContactTags("contact-123"), { wrapper });

    const query = queryClient.getQueryCache().find({
      queryKey: ["contact-tags", "org-123", "contact-123"],
    });

    expect(query).toBeDefined();
  });

  it("should not fetch when contact ID is empty", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useContactTags(""), { wrapper });

    expect(getContactTags).not.toHaveBeenCalled();
  });

  it("should not fetch when organization is not ready", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: false,
    } as ReturnType<typeof useOrganization>);

    const { wrapper } = createWrapper();

    renderHook(() => useContactTags("contact-123"), { wrapper });

    expect(getContactTags).not.toHaveBeenCalled();
  });

  it("should not fetch without an active organization", () => {
    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: null,
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    const { wrapper } = createWrapper();

    renderHook(() => useContactTags("contact-123"), { wrapper });

    expect(getContactTags).not.toHaveBeenCalled();
  });
});

describe("useAssignContactTag", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    vi.mocked(assignContactTag).mockResolvedValue(mockContactTag);
  });

  it("should assign a tag to a contact successfully", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAssignContactTag(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        contactId: "contact-123",
        payload: mockPayload,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockContactTag);
    });

    expect(assignContactTag).toHaveBeenCalledWith("contact-123", mockPayload);
  });

  it("should invalidate the corresponding contact tags query", async () => {
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAssignContactTag(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        contactId: "contact-123",
        payload: mockPayload,
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["contact-tags", "org-123", "contact-123"],
    });
  });

  it("should handle assignment errors", async () => {
    vi.mocked(assignContactTag).mockRejectedValue(
      new Error("Failed to assign contact tag"),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAssignContactTag(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          contactId: "contact-123",
          payload: mockPayload,
        }),
      ).rejects.toThrow("Failed to assign contact tag");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useUnassignContactTag", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useOrganization).mockReturnValue({
      activeOrganization: { id: "org-123" },
      isReady: true,
    } as ReturnType<typeof useOrganization>);

    vi.mocked(unassignContactTag).mockResolvedValue(mockDeleteResponse);
  });

  it("should unassign a tag from a contact successfully", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUnassignContactTag(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        contactId: "contact-123",
        tagId: "tag-123",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual(mockDeleteResponse);
    });

    expect(unassignContactTag).toHaveBeenCalledWith("contact-123", "tag-123");
  });

  it("should invalidate the corresponding contact tags query", async () => {
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUnassignContactTag(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        contactId: "contact-123",
        tagId: "tag-123",
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["contact-tags", "org-123", "contact-123"],
    });
  });

  it("should handle unassignment errors", async () => {
    vi.mocked(unassignContactTag).mockRejectedValue(
      new Error("Failed to unassign contact tag"),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUnassignContactTag(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          contactId: "contact-123",
          tagId: "tag-123",
        }),
      ).rejects.toThrow("Failed to unassign contact tag");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
