import "server-only";

import { headers } from "next/headers";

import { getAuthResponseDetail, isAuthResponse } from "../types/auth-response";
import type { AuthUser } from "../types/auth-user";

import { AuthError } from "./auth-error";

export async function getCurrentUser(): Promise<AuthUser | null> {
  const incomingHeaders = await headers();

  const host = incomingHeaders.get("host");

  if (host === null) {
    throw new AuthError("Unable to determine the application host.", 500);
  }

  const protocol = incomingHeaders.get("x-forwarded-proto") ?? "http";

  const response = await fetch(`${protocol}://${host}/api/auth/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Cookie: incomingHeaders.get("cookie") ?? "",
    },
    cache: "no-store",
  });

  const responseBody: unknown = await response.json();

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new AuthError(
      getAuthResponseDetail(responseBody) ?? "Unable to load the current user.",
      response.status,
    );
  }

  if (!isAuthResponse(responseBody)) {
    throw new AuthError(
      "The authentication service returned an invalid response.",
      502,
    );
  }

  return responseBody.user;
}
