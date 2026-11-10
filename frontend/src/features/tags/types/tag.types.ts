export interface Tag {
  id: string;
  name: string;
  color: string | null;
  organization_id: string;
  created_at: string;
}

export interface TagPayload {
  name: string;
  color: string | null;
}

export interface TagDeleteResponse {
  message: string;
}

export interface TagListResponse {
  items: Tag[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
