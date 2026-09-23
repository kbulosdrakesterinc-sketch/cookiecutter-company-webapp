import type { DirectoryUser } from "../types/user-directory";
import type {
  ProvisionUserInput,
  UserProvisioningFieldErrors,
} from "../types/user-provisioning";

function getStringArray(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.every((item) => typeof item === "string") ? value : undefined;
}

function getFieldErrors(value: unknown): UserProvisioningFieldErrors {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return {
    email: "email" in value ? getStringArray(value.email) : undefined,
    firstName:
      "first_name" in value ? getStringArray(value.first_name) : undefined,
    lastName:
      "last_name" in value ? getStringArray(value.last_name) : undefined,
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

export class UserProvisioningError extends Error {
  public readonly status: number;
  public readonly fieldErrors: UserProvisioningFieldErrors;

  public constructor(
    message: string,
    status: number,
    fieldErrors: UserProvisioningFieldErrors,
  ) {
    super(message);

    this.name = "UserProvisioningError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function provisionUser(
  input: ProvisionUserInput,
): Promise<DirectoryUser> {
  const response = await fetch("/api/users", {
    method: "POST",
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
      fieldErrors.lastName?.[0];

    throw new UserProvisioningError(
      getDetail(body) ?? firstFieldMessage ?? "Unable to provision user.",
      response.status,
      fieldErrors,
    );
  }

  return body as DirectoryUser;
}
