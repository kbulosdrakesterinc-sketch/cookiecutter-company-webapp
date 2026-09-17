import { AuthResponse } from "../types/auth-response";
import { AuthError } from "./auth-error";

type LoginCredentials = {
  email: string;
  password: string;
};

type ErrorResponse = {
  detail?: string;
};

export async function login(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const responseBody = (await response.json()) as AuthResponse | ErrorResponse;

  if (!response.ok) {
    const errorResponse = responseBody as ErrorResponse;

    throw new AuthError(
      errorResponse.detail ?? "Unable to sign in.",
      response.status,
    );
  }

  return responseBody as AuthResponse;
}
