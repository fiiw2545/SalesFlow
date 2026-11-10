export interface NotificationItem {
  id: string;
  user_id: string;
  organization_id: string;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface ReadAllResponse {
  message: string;
  updated_count: number;
}
