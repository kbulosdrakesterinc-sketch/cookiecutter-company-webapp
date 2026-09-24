import { NextResponse } from "next/server";

import type { AuditEventDirectoryResponse } from "@/features/audit/types/audit-event";
import { djangoFetch, DjangoRequestError } from "@/shared/server/django-fetch";

const FORWARDED_QUERY_PARAMETERS = [
  "action",
  "target_type",
  "actor",
  "occurred_after",
  "occurred_before",
  "page",
  "page_size",
] as const;

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const upstreamParams = new URLSearchParams();

  for (const parameter of FORWARDED_QUERY_PARAMETERS) {
    const value = requestUrl.searchParams.get(parameter);

    if (value) {
      upstreamParams.set(parameter, value);
    }
  }

  const query = upstreamParams.toString();

  try {
    const response = await djangoFetch<AuditEventDirectoryResponse>(
      `/audit-events/${query ? `?${query}` : ""}`,
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

    console.error("Unexpected audit event directory request failure.", error);

    return NextResponse.json(
      {
        detail: "Unable to load audit events.",
      },
      {
        status: 500,
      },
    );
  }
}
