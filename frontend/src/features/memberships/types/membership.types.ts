export type MembershipRole = "ADMIN" | "MANAGER" | "SALES";

export interface Membership {
  id: string;
  user_id: string;
  organization_id: string;
  role: MembershipRole;
  joined_at: string;
}

export interface MembershipListResponse {
  items: Membership[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface MembershipCreatePayload {
  user_id: string;
  role: MembershipRole;
}

export interface MembershipUpdatePayload {
  role: MembershipRole;
}

export interface MembershipDeleteResponse {
  message: string;
}
