export interface ProvisionUserInput {
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
}

export interface UserProvisioningFieldErrors {
  readonly email?: readonly string[];
  readonly firstName?: readonly string[];
  readonly lastName?: readonly string[];
}
