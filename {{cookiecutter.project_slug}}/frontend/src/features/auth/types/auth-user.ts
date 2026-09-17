export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly is_staff: boolean;
  readonly is_superuser: boolean;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
}
