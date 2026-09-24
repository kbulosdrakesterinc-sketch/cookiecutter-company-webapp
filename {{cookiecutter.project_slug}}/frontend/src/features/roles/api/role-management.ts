import type { RoleDetail } from "../types/role-detail";
import type {
  RoleManagementFieldErrors,
  RoleManagementInput,
} from "../types/role-management";

function getStringArray(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.every((item) => typeof item === "string") ? value : undefined;
}

function getFieldErrors(value: unknown): RoleManagementFieldErrors {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return {
    name: "name" in value ? getStringArray(value.name) : undefined,
    permissionIds:
      "permission_ids" in value
        ? getStringArray(value.permission_ids)
        : undefined,
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

export class RoleManagementError extends Error {
  public readonly status: number;
  public readonly fieldErrors: RoleManagementFieldErrors;

  public constructor(
    message: string,
    status: number,
    fieldErrors: RoleManagementFieldErrors,
  ) {
    super(message);

    this.name = "RoleManagementError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function manageRole(
  url: string,
  method: "POST" | "PATCH",
  input: RoleManagementInput,
): Promise<RoleDetail> {
  const response = await fetch(url, {
    method,
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
      fieldErrors.name?.[0] ?? fieldErrors.permissionIds?.[0];

    throw new RoleManagementError(
      getDetail(body) ?? firstFieldMessage ?? "Unable to save role.",
      response.status,
      fieldErrors,
    );
  }

  return body as RoleDetail;
}

export async function createRole(
  input: RoleManagementInput,
): Promise<RoleDetail> {
  return manageRole("/api/roles", "POST", input);
}

export async function updateRole(
  roleId: number,
  input: RoleManagementInput,
): Promise<RoleDetail> {
  return manageRole(`/api/roles/${roleId}`, "PATCH", input);
}
