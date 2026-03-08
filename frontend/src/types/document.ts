export interface DocumentItem {
  id: number;
  pool_id: number;
  pool_name: string | null;
  role_type: "seller" | "buyer" | "accountant";
  company_name: string | null;
  uploader_name: string | null;
  file_name: string;
  file_size: number | null;
  memo: string | null;
  created_at: string | null;
}

export interface DocumentListResponse {
  items: DocumentItem[];
  total: number;
  page: number;
  size: number;
}

export interface DocumentUploadResponse {
  id: number;
  file_name: string;
  file_size: number | null;
  created_at: string | null;
}
