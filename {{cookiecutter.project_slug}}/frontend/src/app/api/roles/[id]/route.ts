import { NextResponse } from "next/server";

import { parseRoleId } from "@/features/roles/role-id";
import type { RoleDetail } from "@/features/roles/types/role-detail";
import { djangoFetch, DjangoRequestError } from "@/shared/server/django-fetch";

interface RoleRouteContext {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

interface RoleManagementRequestBody {
  readonly name?: unknown;
  readonly permissionIds?: unknown;
}

function isPermissionIdArray(value: unknown): value is readonly number[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) => typeof item === "number" && Number.isSafeInteger(item) && item > 0,
    )
  );
}

export async function GET(
  _request: Request,
  context: RoleRouteContext,
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

  try {
    const response = await djangoFetch<RoleDetail>(`/roles/${roleId}/`, {
      method: "GET",
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (error instanceof DjangoRequestError) {
      return NextResponse.json(error.body, {
        status: error.status,
      });
    }

    console.error("Unexpected role detail request failure.", error);

    return NextResponse.json(
      {
        detail: "Unable to load role.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: Request,
  context: RoleRouteContext,
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

  const body = requestBody as RoleManagementRequestBody;

  if (
    body.name !== undefined &&
    (typeof body.name !== "string" || body.name.trim().length === 0)
  ) {
    return NextResponse.json(
      {
        name: ["Role name cannot be blank."],
      },
      {
        status: 400,
      },
    );
  }

  if (
    body.permissionIds !== undefined &&
    !isPermissionIdArray(body.permissionIds)
  ) {
    return NextResponse.json(
      {
        permission_ids: ["Permission IDs must be positive integers."],
      },
      {
        status: 400,
      },
    );
  }

  const upstreamBody: Record<string, string | readonly number[]> = {};

  if (typeof body.name === "string") {
    upstreamBody.name = body.name.trim();
  }

  if (isPermissionIdArray(body.permissionIds)) {
    upstreamBody.permission_ids = body.permissionIds;
  }

  try {
    const response = await djangoFetch<RoleDetail>(`/roles/${roleId}/`, {
      method: "PATCH",
      body: JSON.stringify(upstreamBody),
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (error instanceof DjangoRequestError) {
      return NextResponse.json(error.body, {
        status: error.status,
      });
    }

    console.error("Unexpected role management request failure.", error);

    return NextResponse.json(
      {
        detail: "Unable to update role.",
      },
      {
        status: 500,
      },
    );
  }
}
