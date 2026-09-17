export interface AccountActivationRequest {
  readonly password: string;
  readonly password_confirmation: string;
}

export interface AccountActivationFrontendRequest {
  readonly password: string;
  readonly passwordConfirmation: string;
}

export function isAccountActivationFrontendRequest(
  value: unknown,
): value is AccountActivationFrontendRequest {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("password" in value) || typeof value.password !== "string") {
    return false;
  }

  if (
    !("passwordConfirmation" in value) ||
    typeof value.passwordConfirmation !== "string"
  ) {
    return false;
  }

  return value.password.length > 0 && value.passwordConfirmation.length > 0;
}

export function mapAccountActivationRequest(
  value: AccountActivationFrontendRequest,
): AccountActivationRequest {
  return {
    password: value.password,
    password_confirmation: value.passwordConfirmation,
  };
}
