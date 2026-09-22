export type UserAccountState = "active" | "inactive" | "pending_activation";

export interface DirectoryUser {
  readonly id: string;
  readonly email: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly is_active: boolean;
  readonly account_state: UserAccountState;
  readonly date_joined: string;
}

export interface UserDirectoryResponse {
  readonly page: number;
  readonly page_size: number;
  readonly total: number;
  readonly total_pages: number;
  readonly results: readonly DirectoryUser[];
}
