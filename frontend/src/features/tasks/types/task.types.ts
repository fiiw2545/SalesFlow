export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  completed_at: string | null;
  deal_id: string | null;
  contact_id: string | null;
  assigned_to: string;
  organization_id: string;
  created_at: string;
  updated_at: string | null;
}

export interface TaskListResponse {
  items: Task[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface TaskPayload {
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  deal_id: string | null;
  contact_id: string | null;
}

export interface TaskDeleteResponse {
  message: string;
}
