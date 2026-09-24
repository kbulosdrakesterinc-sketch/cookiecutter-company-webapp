import type { RoleDetail } from "../types/role-detail";
import type {
  RoleMembershipCandidateResponse,
  RoleMembershipFieldErrors,
  RoleMembershipInput,
} from "../types/role-membership";

function getStringArray(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.every((item) => typeof item === "string") ? value : undefined;
}

function getFieldErrors(value: unknown): RoleMembershipFieldErrors {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  return {
    addUserIds:
      "add_user_ids" in value
        ? getStringArray(value.add_user_ids)
        : undefined,
    removeUserIds:
      "remove_user_ids" in value
        ? getStringArray(value.remove_user_ids)
        : undefined,
    userIds: "user_ids" in value ? getStringArray(value.user_ids) : undefined,
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

export class RoleMembershipError extends Error {
  public readonly status: number;
  public readonly fieldErrors: RoleMembershipFieldErrors;

  public constructor(
    message: string,
    status: number,
    fieldErrors: RoleMembershipFieldErrors,
  ) {
    super(message);

    this.name = "RoleMembershipError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function getResponseBody(response: Response): Promise<unknown> {
  return response.json();
}

function buildMembershipError(
  body: unknown,
  status: number,
  fallback: string,
): RoleMembershipError {
  const fieldErrors = getFieldErrors(body);
  const firstFieldMessage =
    fieldErrors.addUserIds?.[0] ??
    fieldErrors.removeUserIds?.[0] ??
    fieldErrors.userIds?.[0];

  return new RoleMembershipError(
    getDetail(body) ?? firstFieldMessage ?? fallback,
    status,
    fieldErrors,
  );
}

export async function updateRoleMembership(
  roleId: number,
  input: RoleMembershipInput,
): Promise<RoleDetail> {
  const response = await fetch(`/api/roles/${roleId}/membership`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const body = await getResponseBody(response);

  if (!response.ok) {
    throw buildMembershipError(
      body,
      response.status,
      "Unable to update role membership.",
    );
  }

  return body as RoleDetail;
}

export async function searchRoleMembershipCandidates(
  roleId: number,
  search: string,
  page = 1,
): Promise<RoleMembershipCandidateResponse> {
  const params = new URLSearchParams({
    search: search.trim(),
    page: String(page),
    page_size: "20",
  });

  const response = await fetch(
    `/api/roles/${roleId}/membership-candidates?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  const body = await getResponseBody(response);

  if (!response.ok) {
    throw buildMembershipError(
      body,
      response.status,
      "Unable to search users.",
    );
  }

  return body as RoleMembershipCandidateResponse;
}
