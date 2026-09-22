import { NextResponse } from "next/server";

import type { UserDirectoryResponse } from "@/features/users/types/user-directory";
import { djangoFetch, DjangoRequestError } from "@/shared/server/django-fetch";

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
