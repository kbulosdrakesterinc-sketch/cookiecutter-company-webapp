export interface UpdateUserInput {
  readonly email?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly isActive?: boolean;
}

export interface UserManagementFieldErrors {
  readonly email?: readonly string[];
  readonly firstName?: readonly string[];
  readonly lastName?: readonly string[];
  readonly isActive?: readonly string[];
}
