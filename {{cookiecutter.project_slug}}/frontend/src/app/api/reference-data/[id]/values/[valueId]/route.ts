import { NextResponse } from "next/server";

import type { ReferenceDataValue } from "@/features/reference-data/types/reference-data";
import { djangoFetch, DjangoRequestError } from "@/shared/server/django-fetch";

interface ReferenceDataValueRouteContext {
  readonly params: Promise<{
    readonly id: string;
    readonly valueId: string;
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
  _request: Request,
  context: ReferenceDataValueRouteContext,
): Promise<NextResponse> {
  const { id, valueId } = await context.params;

  try {
    const response = await djangoFetch<ReferenceDataValue>(
      `/reference-data/${encodeURIComponent(id)}/values/${encodeURIComponent(valueId)}/`,
      { method: "GET" },
    );

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (error instanceof DjangoRequestError) {
      return NextResponse.json(error.body, { status: error.status });
    }

    console.error("Unexpected reference-data value detail failure.", error);
    return NextResponse.json(
      { detail: "Unable to load the reference-data value." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: ReferenceDataValueRouteContext,
): Promise<NextResponse> {
  const { id, valueId } = await context.params;
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
    !isOptionalString(body.code) ||
    !isOptionalString(body.name) ||
    !isOptionalString(body.description) ||
    !isOptionalSortOrder(body.sortOrder) ||
    !isOptionalBoolean(body.isActive)
  ) {
    return NextResponse.json(
      { detail: "Reference-data value fields have invalid types." },
      { status: 400 },
    );
  }

  const upstreamBody: Record<string, string | number | boolean> = {};

  if (body.code !== undefined) {
    upstreamBody.code = body.code.trim();
  }

  if (body.name !== undefined) {
    upstreamBody.name = body.name.trim();
  }

  if (body.description !== undefined) {
    upstreamBody.description = body.description.trim();
  }

  if (body.sortOrder !== undefined) {
    upstreamBody.sort_order = body.sortOrder;
  }

  if (body.isActive !== undefined) {
    upstreamBody.is_active = body.isActive;
  }

  try {
    const response = await djangoFetch<ReferenceDataValue>(
      `/reference-data/${encodeURIComponent(id)}/values/${encodeURIComponent(valueId)}/`,
      {
        method: "PATCH",
        body: JSON.stringify(upstreamBody),
      },
    );

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (error instanceof DjangoRequestError) {
      return NextResponse.json(error.body, { status: error.status });
    }

    console.error("Unexpected reference-data value update failure.", error);
    return NextResponse.json(
      { detail: "Unable to update the reference-data value." },
      { status: 500 },
    );
  }
}
