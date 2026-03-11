export interface PoolListItem {
  id: number;
  name: string;
  status: "active" | "closed" | "cancelled";
  collateral_large: string[] | null;
  collateral_small: string[] | null;
  cutoff_date: string | null;
  bid_date: string | null;
  closing_date: string | null;
  seller_name: string | null;
  buyer_name: string | null;
  opb: number | null;
  sale_price: number | null;
  sale_ratio: number | null;
  remarks: string | null;
  can_view_detail: boolean;
}

export interface PoolListResponse {
  items: PoolListItem[];
  total: number;
  page: number;
  size: number;
}

export interface PoolCompanyItem {
  company_id: number;
  name: string;
  advisor: string | null;
  checklist_ok: boolean | null;
}

export interface PoolDetail {
  id: number;
  name: string;
  status: string;
  cutoff_date: string | null;
  bid_date: string | null;
  closing_date: string | null;
  sale_method: string | null;
  bidder_count: number | null;
  seller_companies: PoolCompanyItem[];
  buyer_companies: PoolCompanyItem[];
  collateral_large: string[] | null;
  collateral_small: string[] | null;
  debtor_type: string[] | null;
  debtor_count: number | null;
  bond_count: number | null;
  avg_overdue_months: number | null;
  opb: number | null;
  sale_price: number | null;
  sale_ratio: number | null;
  resale_included: boolean | null;
  resale_debtor_count: number | null;
  resale_bond_count: number | null;
  resale_opb: number | null;
  remarks: string | null;
  created_at: string | null;
  updated_at: string | null;
}
