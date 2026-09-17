import {
  isAccountActivationFrontendRequest,
  mapAccountActivationRequest,
} from "@/features/auth/server/account-activation-request";
import {
  createCookieHeader,
  getSetCookieHeaders,
} from "@/lib/server/django-cookies";
import { serverEnvironment } from "@/lib/server/environment";
import { NextResponse } from "next/server";

interface DjangoCsrfResponse {
  readonly csrfToken: string;
}

function isDjangoCsrfResponse(value: unknown): value is DjangoCsrfResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "csrfToken" in value &&
    typeof value.csrfToken === "string"
  );
}

interface AccountActivationRouteContext {
  readonly params: Promise<{
    readonly uid: string;
    readonly token: string;
  }>;
}

export async function GET(
  request: Request,
  context: AccountActivationRouteContext,
): Promise<NextResponse> {
  void request;

  const { uid, token } = await context.params;

  const response = await fetch(
    `${serverEnvironment.djangoApiUrl}/auth/activate/${encodeURIComponent(uid)}/${encodeURIComponent(token)}/`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  const responseBody: unknown = await response.json();

  return NextResponse.json(responseBody, {
    status: response.status,
  });
}

export async function POST(
  request: Request,
  context: AccountActivationRouteContext,
): Promise<NextResponse> {
  let requestBody: unknown;

  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json(
      {
        detail: "The request body must contain valid JSON",
      },
      {
        status: 400,
      },
    );
  }

  if (!isAccountActivationFrontendRequest(requestBody)) {
    return NextResponse.json(
      {
        detail: "A password and confirmation are required.",
      },
      {
        status: 400,
      },
    );
  }

  const { uid, token } = await context.params;

  const csrfResponse = await fetch(
    `${serverEnvironment.djangoApiUrl}/auth/csrf/`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!csrfResponse.ok) {
    return NextResponse.json(
      {
        detail: "Authentiation service is unavailable.",
      },
      {
        status: 502,
      },
    );
  }

  const csrfBody: unknown = await csrfResponse.json();

  if (!isDjangoCsrfResponse(csrfBody)) {
    return NextResponse.json(
      {
        detail: "Authentiation service returned an invalid CSRF response.",
      },
      {
        status: 502,
      },
    );
  }

  const csrfCookies = getSetCookieHeaders(csrfResponse.headers);

  const activationResponse = await fetch(
    `${serverEnvironment.djangoApiUrl}/auth/activate/${encodeURIComponent(uid)}/${encodeURIComponent(token)}/`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Cookie: createCookieHeader(csrfCookies),
        "X-CSRFToken": csrfBody.csrfToken,
      },
      body: JSON.stringify(mapAccountActivationRequest(requestBody)),
      cache: "no-store",
    },
  );

  const responseBody: unknown = await activationResponse.json();

  return NextResponse.json(responseBody, {
    status: activationResponse.status,
  });
}
