import apiClient from "../../../api/client";
import endpoints from "../../../api/endpoints";

import type {
  NotificationItem,
  NotificationListResponse,
  UnreadCountResponse,
  ReadAllResponse,
} from "../types/notification.types";

export async function getNotifications(
  page = 1,
  limit = 10,
): Promise<NotificationListResponse> {
  const response = await apiClient.get<NotificationListResponse>(
    endpoints.notifications.list,
    {
      params: { page, limit },
    },
  );

  return response.data;
}

export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const response = await apiClient.get<UnreadCountResponse>(
    endpoints.notifications.unreadCount,
  );

  return response.data;
}

export async function markNotificationAsRead(
  id: string,
): Promise<NotificationItem> {
  const response = await apiClient.patch<NotificationItem>(
    endpoints.notifications.read(id),
  );

  return response.data;
}

export async function markAllNotificationsAsRead(): Promise<ReadAllResponse> {
  const response = await apiClient.patch<ReadAllResponse>(
    endpoints.notifications.readAll,
  );

  return response.data;
}
