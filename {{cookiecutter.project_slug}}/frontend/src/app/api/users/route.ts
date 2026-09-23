import { NextResponse } from "next/server";

import type { DirectoryUser, UserDirectoryResponse } from "@/features/users/types/user-directory";
import { djangoFetch, DjangoRequestError } from "@/shared/server/django-fetch";

interface ProvisionUserRequestBody {
  readonly email?: unknown;
  readonly firstName?: unknown;
  readonly lastName?: unknown;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
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
    const response = await djangoFetch<UserDirectoryResponse>(
      `/users/${query ? `?${query}` : ""}`,
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

    console.error("Unexpected users directory request failure.", error);

    return NextResponse.json(
      {
        detail: "Unable to load users.",
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

  const body = requestBody as ProvisionUserRequestBody;

  if (
    typeof body.email !== "string" ||
    body.email.trim().length === 0 ||
    !isOptionalString(body.firstName) ||
    !isOptionalString(body.lastName)
  ) {
    return NextResponse.json(
      {
        detail: "Email is required and names must be strings.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const response = await djangoFetch<DirectoryUser>("/users/", {
      method: "POST",
      body: JSON.stringify({
        email: body.email.trim(),
        first_name: body.firstName?.trim() ?? "",
        last_name: body.lastName?.trim() ?? "",
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

    console.error("Unexpected user provisioning request failure.", error);

    return NextResponse.json(
      {
        detail: "Unable to provision user.",
      },
      {
        status: 500,
      },
    );
  }
}
