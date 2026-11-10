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
