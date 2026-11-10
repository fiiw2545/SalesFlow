export interface DashboardSummary {
  total_deals: number;
  total_deal_value: number;
  won_deals: number;
  won_deal_value: number;
  open_deals: number;
  pending_tasks: number;
  overdue_tasks: number;
  total_activities: number;
}

export interface DealStatusItem {
  status: string;
  count: number;
  total_value: number;
}

export interface DealsByStatusResponse {
  items: DealStatusItem[];
}

export interface DealStageItem {
  stage_id: string;
  stage_name: string;
  count: number;
  total_value: number;
}

export interface DealsByStageResponse {
  items: DealStageItem[];
}

export interface DashboardDateRange {
  startDate?: string;
  endDate?: string;
}

export type DashboardDateFilter =
  | "all"
  | "last7Days"
  | "last30Days"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "custom";

export interface DealReportItem {
  id: string;
  title: string;
  value: number;
  currency: string;
  status: string;
  created_at: string;
  expected_close_date?: string | null;
  stage_id?: string | null;
  company_id?: string | null;
  contact_id?: string | null;
}

export interface DealsReportResponse {
  total_deals: number;
  total_value: number;
  items: DealReportItem[];
}
