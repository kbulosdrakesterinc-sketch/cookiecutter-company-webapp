import { AuthUser } from "./auth-user";

export type AuthResponse = {
  user: AuthUser;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

export function isAuthUser(value: unknown): value is AuthUser {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.email === "string" &&
    typeof value.first_name === "string" &&
    typeof value.last_name === "string" &&
    typeof value.is_staff === "boolean" &&
    typeof value.is_superuser === "boolean" &&
    isStringArray(value.roles) &&
    isStringArray(value.permissions)
  );
}

export function isAuthResponse(value: unknown): value is AuthResponse {
  return isObject(value) && isAuthUser(value.user);
}

export function getAuthResponseDetail(value: unknown): string | null {
  if (!isObject(value) || typeof value.detail !== "string") {
    return null;
  }

  return value.detail;
}
