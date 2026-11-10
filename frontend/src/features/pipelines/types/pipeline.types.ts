export interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface PipelineListResponse {
  items: Pipeline[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PipelinePayload {
  name: string;
  description: string | null;
  is_default: boolean;
}

export interface PipelineDeleteResponse {
  message: string;
}
