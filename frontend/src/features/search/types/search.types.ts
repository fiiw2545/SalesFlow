export type SearchItemType = "company" | "contact" | "deal";

export interface SearchItem {
  type: SearchItemType;
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
}

export interface SearchResponse {
  query: string;
  companies: SearchItem[];
  contacts: SearchItem[];
  deals: SearchItem[];
  total: number;
}
