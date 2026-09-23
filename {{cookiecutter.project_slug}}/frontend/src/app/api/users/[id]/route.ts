import { NextResponse } from "next/server";

import type { DirectoryUser } from "@/features/users/types/user-directory";
import { djangoFetch, DjangoRequestError } from "@/shared/server/django-fetch";

interface UserRouteContext {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

interface UpdateUserRequestBody {
  readonly email?: unknown;
  readonly firstName?: unknown;
  readonly lastName?: unknown;
  readonly isActive?: unknown;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isOptionalBoolean(value: unknown): value is boolean | undefined {
  return value === undefined || typeof value === "boolean";
}

export async function GET(
  _request: Request,
  context: UserRouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;

  try {
    const response = await djangoFetch<DirectoryUser>(
      `/users/${encodeURIComponent(id)}/`,
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

    console.error("Unexpected user detail request failure.", error);

    return NextResponse.json(
      {
        detail: "Unable to load user.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: Request,
  context: UserRouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
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

  const body = requestBody as UpdateUserRequestBody;

  if (
    !isOptionalString(body.email) ||
    !isOptionalString(body.firstName) ||
    !isOptionalString(body.lastName) ||
    !isOptionalBoolean(body.isActive)
  ) {
    return NextResponse.json(
      {
        detail: "User fields have invalid types.",
      },
      {
        status: 400,
      },
    );
  }

  const upstreamBody: Record<string, string | boolean> = {};

  if (body.email !== undefined) {
    upstreamBody.email = body.email.trim();
  }

  if (body.firstName !== undefined) {
    upstreamBody.first_name = body.firstName.trim();
  }

  if (body.lastName !== undefined) {
    upstreamBody.last_name = body.lastName.trim();
  }

  if (body.isActive !== undefined) {
    upstreamBody.is_active = body.isActive;
  }

  try {
    const response = await djangoFetch<DirectoryUser>(
      `/users/${encodeURIComponent(id)}/`,
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

    console.error("Unexpected user management request failure.", error);

    return NextResponse.json(
      {
        detail: "Unable to update user.",
      },
      {
        status: 500,
      },
    );
  }
}
