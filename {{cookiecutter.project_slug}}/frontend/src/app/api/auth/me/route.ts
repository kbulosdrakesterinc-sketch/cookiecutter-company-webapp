import { AuthResponse } from "@/features/auth/types/auth-response";
import { AuthUser } from "@/features/auth/types/auth-user";
import { djangoFetch, DjangoRequestError } from "@/shared/server/django-fetch";
import { NextResponse } from "next/server";

interface DjangoAuthUser {
  readonly id: string;
  readonly email: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly is_staff: boolean;
  readonly is_superuser: boolean;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
}

interface DjangoCurrentUserResponse {
  readonly user: DjangoAuthUser;
}

function mapDjangoAuthUser(user: DjangoAuthUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    is_staff: user.is_staff,
    is_superuser: user.is_superuser,
    roles: user.roles,
    permissions: user.permissions,
  };
}

export async function GET(): Promise<NextResponse> {
  try {
    const djangoResponse = await djangoFetch<DjangoCurrentUserResponse>(
      "/auth/me/",
      {
        method: "GET",
      },
    );

    const response: AuthResponse = {
      user: mapDjangoAuthUser(djangoResponse.user),
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (error instanceof DjangoRequestError) {
      return NextResponse.json(error.body, {
        status: error.status,
      });
    }

    console.error("Unexpected current-user request failure.", error);

    return NextResponse.json(
      {
        detail: "Unable to load the current user.",
      },
      {
        status: 500,
      },
    );
  }
}
