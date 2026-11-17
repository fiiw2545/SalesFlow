export type FileCategory = "IMAGE" | "DOCUMENT" | "OTHER";

export interface StoredFile {
  id: string;
  organization_id: string | null;
  owner_user_id?: string | null;
  original_name: string;
  content_type: string;
  extension: string;
  size: number;
  category: FileCategory;
  uploaded_by: string;
  created_at: string;
}

export interface FileListResponse {
  items: StoredFile[];
  total: number;
  limit: number;
  offset: number;
}

export interface FileDeleteResponse {
  message: string;
  file_id: string;
}

export interface AvatarDeleteResponse {
  message: string;
}
