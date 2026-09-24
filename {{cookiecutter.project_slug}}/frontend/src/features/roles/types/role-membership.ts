import type { RoleDetailUser } from "./role-detail";

export interface RoleMembershipInput {
  readonly addUserIds?: readonly string[];
  readonly removeUserIds?: readonly string[];
}

export interface RoleMembershipFieldErrors {
  readonly addUserIds?: readonly string[];
  readonly removeUserIds?: readonly string[];
  readonly userIds?: readonly string[];
}

export interface RoleMembershipCandidateResponse {
  readonly page: number;
  readonly page_size: number;
  readonly total: number;
  readonly total_pages: number;
  readonly results: readonly RoleDetailUser[];
}
