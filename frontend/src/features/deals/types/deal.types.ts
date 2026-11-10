export type DealStatus = "OPEN" | "WON" | "LOST";

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  status: DealStatus;

  stage_id: string;
  company_id: string | null;
  contact_id: string | null;

  expected_close_date: string | null;

  organization_id: string;
  owner_id: string;

  created_at: string;
  updated_at: string | null;
}

export interface DealCreatePayload {
  title: string;
  value: number;
  currency: string;
  stage_id: string;
  company_id?: string | null;
  contact_id?: string | null;
  expected_close_date?: string | null;
}

export interface DealUpdatePayload {
  title: string;
  value: number;
  currency: string;
  status: DealStatus;
  stage_id: string;
  company_id?: string | null;
  contact_id?: string | null;
  expected_close_date?: string | null;
}

export interface DealDeleteResponse {
  message: string;
}

export interface DealListResponse {
  items: Deal[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
