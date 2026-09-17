import "server-only";

import { cookies } from "next/headers";

import { serverEnvironment } from "@/lib/server/environment";

interface DjangoErrorResponse {
  readonly detail?: string;
}

function isDjangoErrorResponse(value: unknown): value is DjangoErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    (!("detail" in value) ||
      value.detail === undefined ||
      typeof value.detail === "string")
  );
}

function requiresCsrfToken(method: string): boolean {
  return !["GET", "HEAD", "OPTIONS", "TRACE"].includes(method);
}

export class DjangoRequestError extends Error {
  public readonly status: number;
  public readonly detail: string;
  public readonly body: unknown;

  public constructor(detail: string, status: number, body: unknown) {
    super(detail);

    this.name = "DjangoRequestError";
    this.detail = detail;
    this.status = status;
    this.body = body;
  }
}

export async function djangoFetch<T extends object>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const headers = new Headers(init.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (cookieHeader && !headers.has("Cookie")) {
    headers.set("Cookie", cookieHeader);
  }

  const method = (init.method ?? "GET").toUpperCase();

  if (requiresCsrfToken(method) && !headers.has("X-CSRFToken")) {
    const csrfToken = cookieStore.get("csrftoken")?.value;

    if (csrfToken !== undefined) {
      headers.set("X-CSRFToken", csrfToken);
    }
  }

  const response = await fetch(`${serverEnvironment.djangoApiUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const responseBody: unknown = await response.json();

  if (!response.ok) {
    const detail =
      isDjangoErrorResponse(responseBody) &&
      typeof responseBody.detail === "string"
        ? responseBody.detail
        : "Django request failed.";

    throw new DjangoRequestError(detail, response.status, responseBody);
  }

  return responseBody as T;
}
