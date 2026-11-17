import type { MembershipRole } from "../../memberships/types/membership.types";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";

export interface Invitation {
  id: string;
  email: string;
  role: MembershipRole;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}

export interface InvitationListResponse {
  items: Invitation[];
  total: number;
}

export interface InvitationCreatePayload {
  email: string;
  role: MembershipRole;
}

export interface InvitationCreateResponse {
  id: string;
  email: string;
  role: MembershipRole;
  status: InvitationStatus;
  expires_at: string;
  message: string;
}

export interface InvitationValidateResponse {
  email: string;
  organization_name: string;
  role: MembershipRole;
  status: InvitationStatus;
  expires_at: string;
  message: string;
}

export interface InvitationAcceptPayload {
  token: string;
  name?: string;
  password?: string;
}

export interface InvitationAcceptResponse {
  user_id: string;
  organization_id: string;
  role: MembershipRole;
  message: string;
}

export interface InvitationRevokeResponse {
  message: string;
}
