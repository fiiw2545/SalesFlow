export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  role: string;
}

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface OrganizationListResponse {
  items: Organization[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface OrganizationCreatePayload {
  name: string;
  slug: string;
}

export interface OrganizationUpdatePayload {
  name?: string;
  slug?: string;
}

export interface OrganizationCreateResponse {
  organization: OrganizationResponse;
  membership_role: string;
}

export interface OrganizationDeleteResponse {
  message: string;
}
