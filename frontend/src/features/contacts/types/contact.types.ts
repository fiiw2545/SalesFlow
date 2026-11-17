export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  company_id: string | null;
  position: string | null;
  created_at: string;
}

export interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  age: number;
  company_id: string | null;
  position: string | null;
}

export interface ContactListResponse {
  data: Contact[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ContactTagAssignment {
  id: string;
  organization_id: string;
  tag_id: string;
  created_at: string;
}

export interface ContactTagAssignmentPayload {
  tag_id: string;
}

export interface ContactTagDeleteResponse {
  message: string;
}
