import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import {
  getInvitations,
  createInvitation,
  validateInvitation,
  acceptInvitation,
  revokeInvitation,
} from "../services/invitation.service";

import {
  useInvitations,
  useValidateInvitation,
  useCreateInvitation,
  useAcceptInvitation,
  useRevokeInvitation,
} from "./use-invitations";

import type {
  Invitation,
  InvitationListResponse,
  InvitationCreatePayload,
  InvitationAcceptPayload,
} from "../types/invitation.types";

vi.mock("../services/invitation.service", () => ({
  getInvitations: vi.fn(),
  createInvitation: vi.fn(),
  validateInvitation: vi.fn(),
  acceptInvitation: vi.fn(),
  revokeInvitation: vi.fn(),
}));

const mockInvitation: Invitation = {
  id: "invitation-123",
  email: "member@example.com",
  role: "SALES",
  status: "PENDING",
  expires_at: "2026-11-26T10:00:00Z",
  created_at: "2026-11-19T10:00:00Z",
  accepted_at: null,
};

const mockInvitationList: InvitationListResponse = {
  items: [mockInvitation],
  total: 1,
};

const mockCreatePayload: InvitationCreatePayload = {
  email: "member@example.com",
  role: "SALES",
};

const mockCreateResponse = {
  id: "invitation-123",
  email: "member@example.com",
  role: "SALES" as const,
  status: "PENDING" as const,
  expires_at: "2026-11-26T10:00:00Z",
  message: "Invitation created successfully",
};

const mockValidateResponse = {
  email: "member@example.com",
  organization_name: "SalesFlow",
  role: "SALES" as const,
  status: "PENDING" as const,
  expires_at: "2026-11-26T10:00:00Z",
  message: "Invitation is valid",
};

const mockAcceptPayload: InvitationAcceptPayload = {
  token: "valid-token",
  name: "New Member",
  password: "Password123!",
};

const mockAcceptResponse = {
  user_id: "user-123",
  organization_id: "org-123",
  role: "SALES" as const,
  message: "Invitation accepted successfully",
};

const mockRevokeResponse = {
  message: "Invitation revoked successfully",
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

describe("useInvitations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch invitations successfully", async () => {
    vi.mocked(getInvitations).mockResolvedValue(mockInvitationList);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useInvitations("org-123"), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getInvitations).toHaveBeenCalledOnce();
    expect(result.current.data).toEqual(mockInvitationList);
  });

  it("should use organization ID in query key", async () => {
    vi.mocked(getInvitations).mockResolvedValue(mockInvitationList);
    const { wrapper, queryClient } = createWrapper();

    renderHook(() => useInvitations("org-123"), { wrapper });

    await waitFor(() => {
      expect(
        queryClient.getQueryState(["invitations", "org-123"]),
      ).toBeDefined();
    });
  });

  it("should not fetch without organization ID", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useInvitations(), { wrapper });

    expect(getInvitations).not.toHaveBeenCalled();
  });

  it("should handle fetch error", async () => {
    vi.mocked(getInvitations).mockRejectedValue(
      new Error("Failed to fetch invitations"),
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useInvitations("org-123"), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(
      new Error("Failed to fetch invitations"),
    );
  });
});

describe("useValidateInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate invitation successfully", async () => {
    vi.mocked(validateInvitation).mockResolvedValue(mockValidateResponse);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useValidateInvitation("valid-token"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(validateInvitation).toHaveBeenCalledWith("valid-token");
    expect(result.current.data).toEqual(mockValidateResponse);
  });

  it("should include token in query key", async () => {
    vi.mocked(validateInvitation).mockResolvedValue(mockValidateResponse);
    const { wrapper, queryClient } = createWrapper();

    renderHook(() => useValidateInvitation("valid-token"), { wrapper });

    await waitFor(() => {
      expect(
        queryClient.getQueryState(["invitations", "validate", "valid-token"]),
      ).toBeDefined();
    });
  });

  it("should not validate when token is empty", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useValidateInvitation(""), { wrapper });

    expect(validateInvitation).not.toHaveBeenCalled();
  });

  it("should disable retry", async () => {
    vi.mocked(validateInvitation).mockResolvedValue(mockValidateResponse);
    const { wrapper, queryClient } = createWrapper();

    renderHook(() => useValidateInvitation("valid-token"), { wrapper });

    await waitFor(() => {
      expect(
        queryClient.getQueryState(["invitations", "validate", "valid-token"]),
      ).toBeDefined();
    });

    const query = queryClient.getQueryCache().find({
      queryKey: ["invitations", "validate", "valid-token"],
    });

    expect(query?.options.retry).toBe(false);
  });

  it("should handle validation error without retrying", async () => {
    vi.mocked(validateInvitation).mockRejectedValue(
      new Error("Invalid invitation"),
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useValidateInvitation("invalid-token"),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(validateInvitation).toHaveBeenCalledTimes(1);
  });
});

describe("useCreateInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create invitation successfully", async () => {
    vi.mocked(createInvitation).mockResolvedValue(mockCreateResponse);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateInvitation("org-123"), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(mockCreatePayload);
    });

    expect(createInvitation).toHaveBeenCalledWith(mockCreatePayload);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockCreateResponse);
  });

  it("should invalidate invitations for the organization", async () => {
    vi.mocked(createInvitation).mockResolvedValue(mockCreateResponse);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateInvitation("org-123"), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(mockCreatePayload);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["invitations", "org-123"],
    });
  });

  it("should handle create error", async () => {
    vi.mocked(createInvitation).mockRejectedValue(
      new Error("Create invitation failed"),
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateInvitation("org-123"), {
      wrapper,
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync(mockCreatePayload),
      ).rejects.toThrow("Create invitation failed");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useAcceptInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should accept invitation successfully", async () => {
    vi.mocked(acceptInvitation).mockResolvedValue(mockAcceptResponse);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(mockAcceptPayload);
    });

    expect(acceptInvitation).toHaveBeenCalledWith(mockAcceptPayload);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockAcceptResponse);
  });

  it("should invalidate auth me query after accepting", async () => {
    vi.mocked(acceptInvitation).mockResolvedValue(mockAcceptResponse);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(mockAcceptPayload);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["auth", "me"],
    });
  });

  it("should invalidate organizations and invitations queries", async () => {
    vi.mocked(acceptInvitation).mockResolvedValue(mockAcceptResponse);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(mockAcceptPayload);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["organizations", "all"],
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["invitations"],
    });
  });

  it("should handle accept error", async () => {
    vi.mocked(acceptInvitation).mockRejectedValue(
      new Error("Accept invitation failed"),
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useAcceptInvitation(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync(mockAcceptPayload),
      ).rejects.toThrow("Accept invitation failed");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useRevokeInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should revoke invitation successfully", async () => {
    vi.mocked(revokeInvitation).mockResolvedValue(mockRevokeResponse);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRevokeInvitation("org-123"), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync("invitation-123");
    });

    expect(revokeInvitation).toHaveBeenCalledWith("invitation-123");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockRevokeResponse);
  });

  it("should invalidate invitations for the organization", async () => {
    vi.mocked(revokeInvitation).mockResolvedValue(mockRevokeResponse);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRevokeInvitation("org-123"), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync("invitation-123");
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["invitations", "org-123"],
    });
  });

  it("should handle revoke error", async () => {
    vi.mocked(revokeInvitation).mockRejectedValue(
      new Error("Revoke invitation failed"),
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useRevokeInvitation("org-123"), {
      wrapper,
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync("invitation-123"),
      ).rejects.toThrow("Revoke invitation failed");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
