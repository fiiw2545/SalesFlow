export interface Stage {
  id: string;
  pipeline_id: string;
  name: string;
  position: number;
  probability: number;
  created_at: string;
  updated_at: string | null;
}

export interface StagePayload {
  name: string;
  position: number;
  probability: number;
}

export interface StageDeleteResponse {
  message: string;
}

export interface StageListResponse {
  items: Stage[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
