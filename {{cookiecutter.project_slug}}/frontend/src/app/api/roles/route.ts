import { NextResponse } from "next/server";

import type { RoleDetail } from "@/features/roles/types/role-detail";
import type { RoleDirectoryResponse } from "@/features/roles/types/role-directory";
import { djangoFetch, DjangoRequestError } from "@/shared/server/django-fetch";

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

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const upstreamParams = new URLSearchParams();

  const search = requestUrl.searchParams.get("search");
  const page = requestUrl.searchParams.get("page");
  const pageSize = requestUrl.searchParams.get("page_size");

  if (search) {
    upstreamParams.set("search", search);
  }

  if (page) {
    upstreamParams.set("page", page);
  }

  if (pageSize) {
    upstreamParams.set("page_size", pageSize);
  }

  const query = upstreamParams.toString();

  try {
    const response = await djangoFetch<RoleDirectoryResponse>(
      `/roles/${query ? `?${query}` : ""}`,
      {
        method: "GET",
      },
    );

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (error instanceof DjangoRequestError) {
      return NextResponse.json(error.body, {
        status: error.status,
      });
    }

    console.error("Unexpected roles directory request failure.", error);

    return NextResponse.json(
      {
        detail: "Unable to load roles.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
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

  if (typeof body.name !== "string" || body.name.trim().length === 0) {
    return NextResponse.json(
      {
        name: ["Role name is required."],
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

  try {
    const response = await djangoFetch<RoleDetail>("/roles/", {
      method: "POST",
      body: JSON.stringify({
        name: body.name.trim(),
        permission_ids: body.permissionIds ?? [],
      }),
    });

    return NextResponse.json(response, {
      status: 201,
    });
  } catch (error: unknown) {
    if (error instanceof DjangoRequestError) {
      return NextResponse.json(error.body, {
        status: error.status,
      });
    }

    console.error("Unexpected role creation request failure.", error);

    return NextResponse.json(
      {
        detail: "Unable to create role.",
      },
      {
        status: 500,
      },
    );
  }
}
