import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOrganization } from "../../organizations/context/organization.context";

import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notification.service";

const notificationKeys = {
  all: ["notifications"] as const,

  list: (organizationId: string | undefined) =>
    [...notificationKeys.all, organizationId, "list"] as const,

  unreadCount: (organizationId: string | undefined) =>
    [...notificationKeys.all, organizationId, "unread-count"] as const,
};

export function useNotifications(enabled = true) {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: notificationKeys.list(activeOrganization?.id),
    queryFn: ({ signal }) => getNotifications(1, 10, signal),
    enabled: isReady && !!activeOrganization && enabled,
  });
}

export function useUnreadNotificationCount() {
  const { activeOrganization, isReady } = useOrganization();

  return useQuery({
    queryKey: notificationKeys.unreadCount(activeOrganization?.id),
    queryFn: ({ signal }) => getUnreadCount(signal),
    enabled: isReady && !!activeOrganization,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });
    },
  });
}
