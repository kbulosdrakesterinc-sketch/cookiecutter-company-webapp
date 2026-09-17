import {
  AccountActivationInput,
  AccountActivationResult,
} from "../types/account-activation";
import { AuthError } from "./auth-error";

function isStringArray(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function getActivationErrorMessage(value: unknown): string | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  if ("detail" in value && typeof value.detail === "string") {
    return value.detail;
  }

  if ("password" in value && isStringArray(value.password)) {
    return value.password.join(" ");
  }

  if (
    "password_confirmation" in value &&
    isStringArray(value.password_confirmation)
  ) {
    return value.password_confirmation.join(" ");
  }

  return null;
}

export async function activateAccount(
  uid: string,
  token: string,
  input: AccountActivationInput,
): Promise<AccountActivationResult> {
  const response = await fetch(
    `/api/auth/activate/${encodeURIComponent(uid)}/${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    },
  );

  const responseBody: unknown = await response.json();

  if (!response.ok) {
    throw new AuthError(
      getActivationErrorMessage(responseBody) ??
        "Unable to activate your account.",
      response.status,
    );
  }

  return responseBody as AccountActivationResult;
}
