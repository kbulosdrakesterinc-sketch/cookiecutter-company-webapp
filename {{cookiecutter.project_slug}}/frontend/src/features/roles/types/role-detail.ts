export interface RoleDetailUser {
  readonly id: string;
  readonly email: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly is_active: boolean;
}

export interface RoleDetailPermission {
  readonly id: number;
  readonly name: string;
  readonly codename: string;
  readonly app_label: string;
  readonly model: string;
  readonly permission: string;
}

export interface RoleDetail {
  readonly id: number;
  readonly name: string;
  readonly users: readonly RoleDetailUser[];
  readonly permissions: readonly RoleDetailPermission[];
}
