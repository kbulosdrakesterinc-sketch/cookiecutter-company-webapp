import type { DirectoryUser } from "../types/user-directory";
import type {
  UpdateUserInput,
  UserManagementFieldErrors,
} from "../types/user-management";

function getStringArray(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.every((item) => typeof item === "string") ? value : undefined;
}

function getFieldErrors(value: unknown): UserManagementFieldErrors {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return {
    email: "email" in value ? getStringArray(value.email) : undefined,
    firstName:
      "first_name" in value ? getStringArray(value.first_name) : undefined,
    lastName:
      "last_name" in value ? getStringArray(value.last_name) : undefined,
    isActive:
      "is_active" in value ? getStringArray(value.is_active) : undefined,
  };
}

function getDetail(value: unknown): string | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "detail" in value &&
    typeof value.detail === "string"
  ) {
    return value.detail;
  }

  return null;
}

export class UserManagementError extends Error {
  public readonly status: number;
  public readonly fieldErrors: UserManagementFieldErrors;

  public constructor(
    message: string,
    status: number,
    fieldErrors: UserManagementFieldErrors,
  ) {
    super(message);

    this.name = "UserManagementError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function updateUser(
  userId: string,
  input: UpdateUserInput,
): Promise<DirectoryUser> {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const body: unknown = await response.json();

  if (!response.ok) {
    const fieldErrors = getFieldErrors(body);
    const firstFieldMessage =
      fieldErrors.email?.[0] ??
      fieldErrors.firstName?.[0] ??
      fieldErrors.lastName?.[0] ??
      fieldErrors.isActive?.[0];

    throw new UserManagementError(
      getDetail(body) ?? firstFieldMessage ?? "Unable to update user.",
      response.status,
      fieldErrors,
    );
  }

  return body as DirectoryUser;
}
