export type ActivityType = "CALL" | "MEETING" | "EMAIL" | "TASK" | "OTHER";

export interface Activity {
  id: string;
  subject: string;
  type: string;
  description: string | null;
  deal_id: string | null;
  contact_id: string | null;
  organization_id: string;
  performed_by: string;
  created_at: string;
}

export interface ActivityListResponse {
  items: Activity[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ActivityPayload {
  subject: string;
  type: string;
  description: string | null;
  deal_id: string | null;
  contact_id: string | null;
}

export interface ActivityDeleteResponse {
  message: string;
}
