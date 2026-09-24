import { NextResponse } from "next/server";

import type {
  ReferenceDataValue,
  ReferenceDataValueDirectoryResponse,
} from "@/features/reference-data/types/reference-data";
import { djangoFetch, DjangoRequestError } from "@/shared/server/django-fetch";

interface ReferenceDataValueRouteContext {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

interface ReferenceDataValueRequestBody {
  readonly code?: unknown;
  readonly name?: unknown;
  readonly description?: unknown;
  readonly sortOrder?: unknown;
  readonly isActive?: unknown;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isOptionalBoolean(value: unknown): value is boolean | undefined {
  return value === undefined || typeof value === "boolean";
}

function isOptionalSortOrder(value: unknown): value is number | undefined {
  return (
    value === undefined ||
    (typeof value === "number" && Number.isSafeInteger(value) && value >= 0)
  );
}

export async function GET(
  request: Request,
  context: ReferenceDataValueRouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  const requestUrl = new URL(request.url);
  const upstreamParams = new URLSearchParams();

  for (const parameter of ["search", "is_active", "page", "page_size"] as const) {
    const value = requestUrl.searchParams.get(parameter);

    if (value) {
      upstreamParams.set(parameter, value);
    }
  }

  const query = upstreamParams.toString();

  try {
    const response = await djangoFetch<ReferenceDataValueDirectoryResponse>(
      `/reference-data/${encodeURIComponent(id)}/values/${query ? `?${query}` : ""}`,
      { method: "GET" },
    );

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (error instanceof DjangoRequestError) {
      return NextResponse.json(error.body, { status: error.status });
    }

    console.error("Unexpected reference-data values request failure.", error);
    return NextResponse.json(
      { detail: "Unable to load reference-data values." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: ReferenceDataValueRouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "The request body must contain valid JSON." },
      { status: 400 },
    );
  }

  if (typeof requestBody !== "object" || requestBody === null) {
    return NextResponse.json(
      { detail: "The request body must be an object." },
      { status: 400 },
    );
  }

  const body = requestBody as ReferenceDataValueRequestBody;

  if (
    typeof body.code !== "string" ||
    body.code.trim().length === 0 ||
    typeof body.name !== "string" ||
    body.name.trim().length === 0 ||
    !isOptionalString(body.description) ||
    !isOptionalSortOrder(body.sortOrder) ||
    !isOptionalBoolean(body.isActive)
  ) {
    return NextResponse.json(
      { detail: "Reference-data value fields have invalid types or are missing." },
      { status: 400 },
    );
  }

  try {
    const response = await djangoFetch<ReferenceDataValue>(
      `/reference-data/${encodeURIComponent(id)}/values/`,
      {
        method: "POST",
        body: JSON.stringify({
          code: body.code.trim(),
          name: body.name.trim(),
          description: body.description?.trim() ?? "",
          sort_order: body.sortOrder ?? 0,
          is_active: body.isActive ?? true,
        }),
      },
    );

    return NextResponse.json(response, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof DjangoRequestError) {
      return NextResponse.json(error.body, { status: error.status });
    }

    console.error("Unexpected reference-data value creation failure.", error);
    return NextResponse.json(
      { detail: "Unable to create the reference-data value." },
      { status: 500 },
    );
  }
}
