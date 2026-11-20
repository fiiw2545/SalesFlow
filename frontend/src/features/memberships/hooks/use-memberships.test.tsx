import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import {
  getMemberships,
  createMembership,
  updateMembership,
  deleteMembership,
} from "../services/membership.service";

import {
  useMemberships,
  useCreateMembership,
  useUpdateMembership,
  useDeleteMembership,
} from "./use-memberships";

import type {
  Membership,
  MembershipListResponse,
  MembershipCreatePayload,
} from "../types/membership.types";

vi.mock("../services/membership.service", () => ({
  getMemberships: vi.fn(),
  createMembership: vi.fn(),
  updateMembership: vi.fn(),
  deleteMembership: vi.fn(),
}));

const mockMembership: Membership = {
  id: "membership-123",
  user_id: "user-123",
  name: "Test Member",
  email: "member@example.com",
  organization_id: "org-123",
  role: "SALES",
  joined_at: "2026-11-19T10:00:00Z",
};

const mockMembershipList: MembershipListResponse = {
  items: [mockMembership],
  total: 1,
  page: 1,
  limit: 10,
  total_pages: 1,
};

const mockCreatePayload: MembershipCreatePayload = {
  user_id: "user-456",
  role: "SALES",
};

const mockCreatedMembership: Membership = {
  ...mockMembership,
  id: "membership-456",
  user_id: "user-456",
};

const mockUpdatedMembership: Membership = {
  ...mockMembership,
  role: "MANAGER",
};

const mockDeleteResponse = {
  message: "Membership deleted successfully",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, queryClient };
}

describe("useMemberships", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch memberships successfully", async () => {
    vi.mocked(getMemberships).mockResolvedValue(mockMembershipList);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMemberships("org-123"), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getMemberships).toHaveBeenCalledWith(1, 10);
    expect(result.current.data).toEqual(mockMembershipList);
  });

  it("should use custom page and limit", async () => {
    vi.mocked(getMemberships).mockResolvedValue({
      ...mockMembershipList,
      page: 2,
      limit: 20,
    });

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMemberships("org-123", 2, 20), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getMemberships).toHaveBeenCalledWith(2, 20);
  });

  it("should include organization, page and limit in query key", async () => {
    vi.mocked(getMemberships).mockResolvedValue(mockMembershipList);
    const { wrapper, queryClient } = createWrapper();

    renderHook(() => useMemberships("org-123", 2, 20), { wrapper });

    await waitFor(() => {
      expect(
        queryClient.getQueryState(["memberships", "org-123", 2, 20]),
      ).toBeDefined();
    });
  });

  it("should not fetch without organization ID", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useMemberships(), { wrapper });

    expect(getMemberships).not.toHaveBeenCalled();
  });
});

describe("useCreateMembership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create membership successfully", async () => {
    vi.mocked(createMembership).mockResolvedValue(mockCreatedMembership);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateMembership("org-123"), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(mockCreatePayload);
    });

    expect(createMembership).toHaveBeenCalledWith(mockCreatePayload);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockCreatedMembership);
  });

  it("should invalidate memberships for the organization", async () => {
    vi.mocked(createMembership).mockResolvedValue(mockCreatedMembership);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateMembership("org-123"), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(mockCreatePayload);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["memberships", "org-123"],
    });
  });

  it("should handle create error", async () => {
    vi.mocked(createMembership).mockRejectedValue(
      new Error("Create membership failed"),
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateMembership("org-123"), {
      wrapper,
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync(mockCreatePayload),
      ).rejects.toThrow("Create membership failed");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useUpdateMembership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update membership successfully", async () => {
    vi.mocked(updateMembership).mockResolvedValue(mockUpdatedMembership);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUpdateMembership("org-123"), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: "membership-123",
        role: "MANAGER",
      });
    });

    expect(updateMembership).toHaveBeenCalledWith("membership-123", {
      role: "MANAGER",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUpdatedMembership);
  });

  it("should invalidate memberships for the organization", async () => {
    vi.mocked(updateMembership).mockResolvedValue(mockUpdatedMembership);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateMembership("org-123"), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: "membership-123",
        role: "MANAGER",
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["memberships", "org-123"],
    });
  });

  it("should handle update error", async () => {
    vi.mocked(updateMembership).mockRejectedValue(
      new Error("Update membership failed"),
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUpdateMembership("org-123"), {
      wrapper,
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          id: "membership-123",
          role: "MANAGER",
        }),
      ).rejects.toThrow("Update membership failed");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useDeleteMembership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete membership successfully", async () => {
    vi.mocked(deleteMembership).mockResolvedValue(mockDeleteResponse);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDeleteMembership("org-123"), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync("membership-123");
    });

    expect(deleteMembership).toHaveBeenCalledWith("membership-123");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockDeleteResponse);
  });

  it("should invalidate memberships for the organization", async () => {
    vi.mocked(deleteMembership).mockResolvedValue(mockDeleteResponse);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteMembership("org-123"), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync("membership-123");
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["memberships", "org-123"],
    });
  });

  it("should handle delete error", async () => {
    vi.mocked(deleteMembership).mockRejectedValue(
      new Error("Delete membership failed"),
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDeleteMembership("org-123"), {
      wrapper,
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync("membership-123"),
      ).rejects.toThrow("Delete membership failed");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
