import { NextResponse } from "next/server";

import type {
  ReferenceDataSet,
  ReferenceDataSetDirectoryResponse,
} from "@/features/reference-data/types/reference-data";
import { djangoFetch, DjangoRequestError } from "@/shared/server/django-fetch";

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

export async function GET(request: Request): Promise<NextResponse> {
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
    const response = await djangoFetch<ReferenceDataSetDirectoryResponse>(
      `/reference-data/${query ? `?${query}` : ""}`,
      { method: "GET" },
    );

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (error instanceof DjangoRequestError) {
      return NextResponse.json(error.body, { status: error.status });
    }

    console.error("Unexpected reference-data directory request failure.", error);
    return NextResponse.json(
      { detail: "Unable to load reference data." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
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
    typeof body.code !== "string" ||
    body.code.trim().length === 0 ||
    typeof body.name !== "string" ||
    body.name.trim().length === 0 ||
    !isOptionalString(body.description) ||
    !isOptionalBoolean(body.isActive)
  ) {
    return NextResponse.json(
      { detail: "Reference-data set fields have invalid types or are missing." },
      { status: 400 },
    );
  }

  try {
    const response = await djangoFetch<ReferenceDataSet>("/reference-data/", {
      method: "POST",
      body: JSON.stringify({
        code: body.code.trim(),
        name: body.name.trim(),
        description: body.description?.trim() ?? "",
        is_active: body.isActive ?? true,
      }),
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof DjangoRequestError) {
      return NextResponse.json(error.body, { status: error.status });
    }

    console.error("Unexpected reference-data creation request failure.", error);
    return NextResponse.json(
      { detail: "Unable to create reference data." },
      { status: 500 },
    );
  }
}
