import "server-only";

import type { NextResponse } from "next/server";

type HeadersWithGetSetCookie = Headers & {
  getSetCookie?: () => string[];
};

export function getSetCookieHeaders(headers: Headers): string[] {
  const headersWithGetSetCookie = headers as HeadersWithGetSetCookie;

  if (headersWithGetSetCookie.getSetCookie) {
    return headersWithGetSetCookie.getSetCookie();
  }

  const setCookie = headers.get("set-cookie");

  return setCookie ? [setCookie] : [];
}

export function appendDjangoCookies(
  upstreamResponse: Response,
  downstreamResponse: NextResponse,
): void {
  const setCookieHeaders = getSetCookieHeaders(upstreamResponse.headers);

  for (const setCookieHeader of setCookieHeaders) {
    downstreamResponse.headers.append("set-cookie", setCookieHeader);
  }
}

export function createCookieHeader(setCookieHeaders: string[]): string {
  return setCookieHeaders
    .map((setCookieHeader) => {
      return setCookieHeader.split(";", 1)[0];
    })
    .join("; ");
}
