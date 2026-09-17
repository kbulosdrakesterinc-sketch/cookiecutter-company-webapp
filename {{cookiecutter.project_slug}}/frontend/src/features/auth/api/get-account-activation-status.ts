import "server-only";
import { AccountActivationStatus } from "../types/account-activation";
import { headers } from "next/headers";
import { AuthError } from "./auth-error";

interface ErrorResponse {
  readonly detail?: string;
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    (!("detail" in value) ||
      value.detail === undefined ||
      typeof value.detail === "string")
  );
}

export async function getAccountActivationStatus(
  uid: string,
  token: string,
): Promise<AccountActivationStatus> {
  const incomingHeaders = await headers();

  const host = incomingHeaders.get("host");

  if (host === null) {
    throw new AuthError("Unable to determine the application host.", 500);
  }

  const protocol = incomingHeaders.get("x-forwarded-proto") ?? "http";

  const response = await fetch(
    `${protocol}://${host}/api/auth/activate/${encodeURIComponent(uid)}/${encodeURIComponent(token)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const responseBody: unknown = await response.json();

  if (!response.ok) {
    const detail =
      isErrorResponse(responseBody) && typeof responseBody.detail === "string"
        ? responseBody.detail
        : "Unable to validate this activation link.";

    throw new AuthError(detail, response.status);
  }

  return responseBody as AccountActivationStatus;
}
