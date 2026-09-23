export interface DirectoryRole {
  readonly id: number;
  readonly name: string;
  readonly user_count: number;
  readonly permission_count: number;
}

export interface RoleDirectoryResponse {
  readonly page: number;
  readonly page_size: number;
  readonly total: number;
  readonly total_pages: number;
  readonly results: readonly DirectoryRole[];
}
