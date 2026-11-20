import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notification.service";

import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "./use-notifications";

import type {
  NotificationItem,
  NotificationListResponse,
} from "../types/notification.types";

vi.mock("../services/notification.service", () => ({
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
}));

vi.mock("../../organizations/context/organization.context", () => ({
  useOrganization: vi.fn(),
}));

const mockOrganization = {
  id: "org-123",
  name: "Test Organization",
};

const mockNotification: NotificationItem = {
  id: "notification-123",
  user_id: "user-123",
  organization_id: "org-123",
  type: "DEAL",
  title: "New Deal",
  message: "A new deal has been created",
  entity_type: "deal",
  entity_id: "deal-123",
  is_read: false,
  created_at: "2026-11-19T10:00:00Z",
};

const mockNotificationList: NotificationListResponse = {
  items: [mockNotification],
  total: 1,
  page: 1,
  limit: 10,
  total_pages: 1,
};

const mockUnreadCount = {
  unread_count: 5,
};

const mockReadNotification: NotificationItem = {
  ...mockNotification,
  is_read: true,
};

const mockReadAllResponse = {
  message: "All notifications marked as read",
  updated_count: 5,
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

function mockOrganizationContext(
  overrides: Partial<{
    activeOrganization: typeof mockOrganization | null;
    isReady: boolean;
  }> = {},
) {
  vi.mocked(useOrganization).mockReturnValue({
    activeOrganization: mockOrganization,
    isReady: true,
    ...overrides,
  } as ReturnType<typeof useOrganization>);
}

describe("useNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrganizationContext();
  });

  it("should fetch notifications successfully", async () => {
    vi.mocked(getNotifications).mockResolvedValue(mockNotificationList);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getNotifications).toHaveBeenCalledWith(
      1,
      10,
      expect.any(AbortSignal),
    );
    expect(result.current.data).toEqual(mockNotificationList);
  });

  it("should use the organization-specific query key", async () => {
    vi.mocked(getNotifications).mockResolvedValue(mockNotificationList);
    const { wrapper, queryClient } = createWrapper();

    renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(
        queryClient.getQueryState(["notifications", "org-123", "list"]),
      ).toBeDefined();
    });
  });

  it("should pass an AbortSignal to the service", async () => {
    vi.mocked(getNotifications).mockResolvedValue(mockNotificationList);
    const { wrapper } = createWrapper();

    renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(getNotifications).toHaveBeenCalled();
    });

    const signal = vi.mocked(getNotifications).mock.calls[0][2];

    expect(signal).toBeInstanceOf(AbortSignal);
  });

  it("should not fetch when organization context is not ready", () => {
    mockOrganizationContext({ isReady: false });
    const { wrapper } = createWrapper();

    renderHook(() => useNotifications(), { wrapper });

    expect(getNotifications).not.toHaveBeenCalled();
  });

  it("should not fetch without active organization", () => {
    mockOrganizationContext({ activeOrganization: null });
    const { wrapper } = createWrapper();

    renderHook(() => useNotifications(), { wrapper });

    expect(getNotifications).not.toHaveBeenCalled();
  });

  it("should not fetch when enabled is false", () => {
    const { wrapper } = createWrapper();

    renderHook(() => useNotifications(false), { wrapper });

    expect(getNotifications).not.toHaveBeenCalled();
  });
});

describe("useUnreadNotificationCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrganizationContext();
  });

  it("should fetch unread count successfully", async () => {
    vi.mocked(getUnreadCount).mockResolvedValue(mockUnreadCount);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useUnreadNotificationCount(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getUnreadCount).toHaveBeenCalledWith(expect.any(AbortSignal));
    expect(result.current.data).toEqual(mockUnreadCount);
  });

  it("should use the organization-specific query key", async () => {
    vi.mocked(getUnreadCount).mockResolvedValue(mockUnreadCount);
    const { wrapper, queryClient } = createWrapper();

    renderHook(() => useUnreadNotificationCount(), { wrapper });

    await waitFor(() => {
      expect(
        queryClient.getQueryState(["notifications", "org-123", "unread-count"]),
      ).toBeDefined();
    });
  });

  it("should refetch every 30 seconds", async () => {
    vi.mocked(getUnreadCount).mockResolvedValue(mockUnreadCount);
    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useUnreadNotificationCount(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const query = queryClient.getQueryCache().find({
      queryKey: ["notifications", "org-123", "unread-count"],
    });

    expect(query).toBeDefined();
    expect(result.current.refetch).toBeDefined();
  });

  it("should not fetch when organization context is not ready", () => {
    mockOrganizationContext({ isReady: false });
    const { wrapper } = createWrapper();

    renderHook(() => useUnreadNotificationCount(), { wrapper });

    expect(getUnreadCount).not.toHaveBeenCalled();
  });

  it("should not fetch without active organization", () => {
    mockOrganizationContext({ activeOrganization: null });
    const { wrapper } = createWrapper();

    renderHook(() => useUnreadNotificationCount(), { wrapper });

    expect(getUnreadCount).not.toHaveBeenCalled();
  });
});

describe("useMarkNotificationAsRead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should mark notification as read successfully", async () => {
    vi.mocked(markNotificationAsRead).mockResolvedValue(mockReadNotification);

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMarkNotificationAsRead(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync("notification-123");
    });

    expect(markNotificationAsRead).toHaveBeenCalledWith("notification-123");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockReadNotification);
  });

  it("should invalidate all notification queries after success", async () => {
    vi.mocked(markNotificationAsRead).mockResolvedValue(mockReadNotification);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useMarkNotificationAsRead(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync("notification-123");
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["notifications"],
    });
  });

  it("should handle mark as read error", async () => {
    vi.mocked(markNotificationAsRead).mockRejectedValue(
      new Error("Mark notification as read failed"),
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMarkNotificationAsRead(), {
      wrapper,
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync("notification-123"),
      ).rejects.toThrow("Mark notification as read failed");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe("useMarkAllNotificationsAsRead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should mark all notifications as read successfully", async () => {
    vi.mocked(markAllNotificationsAsRead).mockResolvedValue(
      mockReadAllResponse,
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMarkAllNotificationsAsRead(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(markAllNotificationsAsRead).toHaveBeenCalled();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockReadAllResponse);
  });

  it("should invalidate all notification queries after success", async () => {
    vi.mocked(markAllNotificationsAsRead).mockResolvedValue(
      mockReadAllResponse,
    );

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useMarkAllNotificationsAsRead(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["notifications"],
    });
  });

  it("should handle mark all as read error", async () => {
    vi.mocked(markAllNotificationsAsRead).mockRejectedValue(
      new Error("Mark all notifications as read failed"),
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useMarkAllNotificationsAsRead(), {
      wrapper,
    });

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow(
        "Mark all notifications as read failed",
      );
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
