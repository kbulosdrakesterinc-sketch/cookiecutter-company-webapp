import { NextResponse } from "next/server";

import { parseRoleId } from "@/features/roles/role-id";
import type { RoleMembershipCandidateResponse } from "@/features/roles/types/role-membership";
import { djangoFetch, DjangoRequestError } from "@/shared/server/django-fetch";

interface RoleMembershipCandidatesRouteContext {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

export async function GET(
  request: Request,
  context: RoleMembershipCandidatesRouteContext,
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
    const response = await djangoFetch<RoleMembershipCandidateResponse>(
      `/roles/${roleId}/membership-candidates/${query ? `?${query}` : ""}`,
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

    console.error("Unexpected role membership search failure.", error);

    return NextResponse.json(
      {
        detail: "Unable to search users for role membership.",
      },
      {
        status: 500,
      },
    );
  }
}
