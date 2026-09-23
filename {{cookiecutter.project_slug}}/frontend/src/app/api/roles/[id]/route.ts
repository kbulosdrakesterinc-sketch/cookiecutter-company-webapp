import { NextResponse } from "next/server";

import { parseRoleId } from "@/features/roles/role-id";
import type { RoleDetail } from "@/features/roles/types/role-detail";
import { djangoFetch, DjangoRequestError } from "@/shared/server/django-fetch";

interface RoleRouteContext {
  readonly params: Promise<{
    readonly id: string;
  }>;
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
