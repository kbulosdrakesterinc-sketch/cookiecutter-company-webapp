import { appendDjangoCookies } from "@/lib/server/django-cookies";
import { serverEnvironment } from "@/lib/server/environment";
import { getIncomingCookieHeader } from "@/lib/server/request-cookies";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const csrfCookie = cookieStore.get("csrftoken");
  const cookieHeader = await getIncomingCookieHeader();

  if (!csrfCookie || !cookieHeader) {
    const response = new NextResponse(null, {
      status: 204,
    });

    response.cookies.delete("sessionid");
    response.cookies.delete("csrftoken");

    return response;
  }

  const upStreamResponse = await fetch(
    `${serverEnvironment.djangoApiUrl}/auth/logout/`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader,
        "X-CSRFToken": csrfCookie.value,
      },
      cache: "no-cache",
    },
  );

  if (upStreamResponse.status !== 204 && !upStreamResponse.ok) {
    const responseBody = await upStreamResponse.json().catch(() => ({
      detail: "Unable to log out.",
    }));

    return NextResponse.json(responseBody, {
      status: upStreamResponse.status,
    });
  }

  const response = new NextResponse(null, {
    status: 204,
  });

  appendDjangoCookies(upStreamResponse, response);

  return response;
}
