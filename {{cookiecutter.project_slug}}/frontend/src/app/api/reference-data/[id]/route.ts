import { NextResponse } from "next/server";

import type { ReferenceDataSet } from "@/features/reference-data/types/reference-data";
import { djangoFetch, DjangoRequestError } from "@/shared/server/django-fetch";

interface ReferenceDataSetRouteContext {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

interface ReferenceDataSetRequestBody {
  readonly code?: unknown;
  readonly name?: unknown;
  readonly description?: unknown;
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
  context: ReferenceDataSetRouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;

  try {
    const response = await djangoFetch<ReferenceDataSet>(
      `/reference-data/${encodeURIComponent(id)}/`,
      { method: "GET" },
    );

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (error instanceof DjangoRequestError) {
      return NextResponse.json(error.body, { status: error.status });
    }

    console.error("Unexpected reference-data detail request failure.", error);
    return NextResponse.json(
      { detail: "Unable to load the reference-data set." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: ReferenceDataSetRouteContext,
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

  const body = requestBody as ReferenceDataSetRequestBody;

  if (
    !isOptionalString(body.code) ||
    !isOptionalString(body.name) ||
    !isOptionalString(body.description) ||
    !isOptionalBoolean(body.isActive)
  ) {
    return NextResponse.json(
      { detail: "Reference-data set fields have invalid types." },
      { status: 400 },
    );
  }

  const upstreamBody: Record<string, string | boolean> = {};

  if (body.code !== undefined) {
    upstreamBody.code = body.code.trim();
  }

  if (body.name !== undefined) {
    upstreamBody.name = body.name.trim();
  }

  if (body.description !== undefined) {
    upstreamBody.description = body.description.trim();
  }

  if (body.isActive !== undefined) {
    upstreamBody.is_active = body.isActive;
  }

  try {
    const response = await djangoFetch<ReferenceDataSet>(
      `/reference-data/${encodeURIComponent(id)}/`,
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

    console.error("Unexpected reference-data update request failure.", error);
    return NextResponse.json(
      { detail: "Unable to update the reference-data set." },
      { status: 500 },
    );
  }
}
