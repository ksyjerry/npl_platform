export interface GlossaryItem {
  id: number;
  term: string;
  definition: string;
  sort_order: number;
}

export interface GlossaryListResponse {
  items: GlossaryItem[];
}
