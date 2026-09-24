export interface RoleManagementInput {
  readonly name: string;
  readonly permissionIds: readonly number[];
}

export interface RoleManagementFieldErrors {
  readonly name?: readonly string[];
  readonly permissionIds?: readonly string[];
}
