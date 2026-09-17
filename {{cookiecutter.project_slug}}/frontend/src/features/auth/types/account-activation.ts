export interface AccountActivationStatus {
  readonly email: string;
}

export interface AccountActivationInput {
  readonly password: string;
  readonly passwordConfirmation: string;
}

export interface AccountActivationResult {
  readonly detail: string;
}
