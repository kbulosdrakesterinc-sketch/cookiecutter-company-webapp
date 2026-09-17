import { AuthError } from "./auth-error";

export async function logout(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
  });

  if (!response.ok) {
    const responseBody = (await response.json().catch(() => null)) as {
      detail?: string;
    } | null;

    throw new AuthError(
      responseBody?.detail ?? "Unable to log out.",
      response.status,
    );
  }
}
