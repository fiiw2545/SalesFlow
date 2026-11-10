export interface Company {
  id: string;
  name: string;
  address: string | null;
  industry: string | null;
  phone: string | null;
  website: string | null;
  created_by: string;
  organization_id: string;
  created_at: string;
  updated_at: string | null;
}

export interface CompanyListResponse {
  items: Company[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CompanyPayload {
  name: string;
  address: string | null;
  industry: string | null;
  phone: string | null;
  website: string | null;
}

export interface CompanyDeleteResponse {
  message: string;
}
