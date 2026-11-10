export interface Note {
  id: string;
  title: string;
  content: string;
  company_id: string | null;
  contact_id: string | null;
  deal_id: string | null;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string | null;
}

export interface NoteListResponse {
  items: Note[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface NotePayload {
  title: string;
  content: string;
  company_id: string | null;
  contact_id: string | null;
  deal_id: string | null;
}

export interface NoteDeleteResponse {
  message: string;
}
