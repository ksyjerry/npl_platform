export interface Notice {
  id: number;
  category: string;
  title: string;
  has_attachment: boolean;
  created_by_name: string;
  created_at: string;
}

export interface NoticeDetail extends Notice {
  content: string;
  attachment_doc_id: number | null;
  attachment_name: string | null;
}

export interface NoticeCreateInput {
  pool_id?: number;
  category: string;
  title: string;
  content: string;
  file?: File;
}

export interface NoticeListResponse {
  items: Notice[];
  total: number;
}
