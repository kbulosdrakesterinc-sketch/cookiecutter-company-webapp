import { NextResponse } from "next/server";

import type { RoleDetailPermission } from "@/features/roles/types/role-detail";
import { djangoFetch, DjangoRequestError } from "@/shared/server/django-fetch";

export async function GET(): Promise<NextResponse> {
  try {
    const response = await djangoFetch<RoleDetailPermission[]>("/permissions/", {
      method: "GET",
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (error instanceof DjangoRequestError) {
      return NextResponse.json(error.body, {
        status: error.status,
      });
    }

    console.error("Unexpected permission catalog request failure.", error);

    return NextResponse.json(
      {
        detail: "Unable to load permissions.",
      },
      {
        status: 500,
      },
    );
  }
}
