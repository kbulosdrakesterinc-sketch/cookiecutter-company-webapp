import { NextResponse } from "next/server";

import { parseRoleId } from "@/features/roles/role-id";
import type { RoleDetail } from "@/features/roles/types/role-detail";
import { djangoFetch, DjangoRequestError } from "@/shared/server/django-fetch";

interface RoleMembershipRouteContext {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

interface RoleMembershipRequestBody {
  readonly addUserIds?: unknown;
  readonly removeUserIds?: unknown;
}

function isOptionalStringArray(
  value: unknown,
): value is readonly string[] | undefined {
  return (
    value === undefined ||
    (Array.isArray(value) &&
      value.every((item) => typeof item === "string" && item.length > 0))
  );
}

export async function PATCH(
  request: Request,
  context: RoleMembershipRouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  const roleId = parseRoleId(id);

  if (roleId === null) {
    return NextResponse.json(
      {
        detail: "Role ID must be a positive integer.",
      },
      {
        status: 400,
      },
    );
  }

  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      {
        detail: "The request body must contain valid JSON.",
      },
      {
        status: 400,
      },
    );
  }

  if (typeof requestBody !== "object" || requestBody === null) {
    return NextResponse.json(
      {
        detail: "The request body must be an object.",
      },
      {
        status: 400,
      },
    );
  }

  const unsupportedFields = Object.keys(requestBody).filter(
    (field) => field !== "addUserIds" && field !== "removeUserIds",
  );

  if (unsupportedFields.length > 0) {
    return NextResponse.json(
      {
        detail: "The request contains unsupported membership fields.",
      },
      {
        status: 400,
      },
    );
  }

  const body = requestBody as RoleMembershipRequestBody;

  if (
    !isOptionalStringArray(body.addUserIds) ||
    !isOptionalStringArray(body.removeUserIds)
  ) {
    return NextResponse.json(
      {
        detail: "Membership user IDs must be arrays of UUID strings.",
      },
      {
        status: 400,
      },
    );
  }

  const upstreamBody: {
    add_user_ids?: readonly string[];
    remove_user_ids?: readonly string[];
  } = {};

  if (body.addUserIds !== undefined) {
    upstreamBody.add_user_ids = body.addUserIds;
  }

  if (body.removeUserIds !== undefined) {
    upstreamBody.remove_user_ids = body.removeUserIds;
  }

  try {
    const response = await djangoFetch<RoleDetail>(
      `/roles/${roleId}/membership/`,
      {
        method: "PATCH",
        body: JSON.stringify(upstreamBody),
      },
    );

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (error instanceof DjangoRequestError) {
      return NextResponse.json(error.body, {
        status: error.status,
      });
    }

    console.error("Unexpected role membership request failure.", error);

    return NextResponse.json(
      {
        detail: "Unable to update role membership.",
      },
      {
        status: 500,
      },
    );
  }
}
