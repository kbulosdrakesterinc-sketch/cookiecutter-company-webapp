import { serverEnvironment } from "@/lib/server/environment";
import {
  appendDjangoCookies,
  createCookieHeader,
  getSetCookieHeaders,
} from "@/lib/server/django-cookies";
import { NextResponse } from "next/server";

type LoginRequestBody = {
  email?: unknown;
  password?: unknown;
};

type DjangoCsrfResponse = {
  csrfToken: string;
};

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidPassword(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: LoginRequestBody;

  try {
    body = (await request.json()) as LoginRequestBody;
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

  if (!isValidEmail(body.email) || !isValidPassword(body.password)) {
    return NextResponse.json(
      {
        detail: "Email and password are required",
      },
      {
        status: 400,
      },
    );
  }

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
        detail: "Authentication service is unavailable",
      },
      {
        status: 502,
      },
    );
  }

  const csrfData = (await csrfResponse.json()) as DjangoCsrfResponse;

  const csrfCookies = getSetCookieHeaders(csrfResponse.headers);

  const loginResponse = await fetch(
    `${serverEnvironment.djangoApiUrl}/auth/login/`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Cookie: createCookieHeader(csrfCookies),
        "X-CSRFToken": csrfData.csrfToken,
      },
      body: JSON.stringify({
        email: body.email.trim(),
        password: body.password,
      }),
      cache: "no-store",
    },
  );

  const responseBody = await loginResponse.json().catch(() => ({
    detail: "Authentication service returns an invalid response.",
  }));

  const response = NextResponse.json(responseBody, {
    status: loginResponse.status,
  });

  appendDjangoCookies(loginResponse, response);

  return response;
}
