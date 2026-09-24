import "server-only";

import { headers } from "next/headers";

import type {
  AuditEventDirectoryResponse,
  AuditEventFilters,
} from "../types/audit-event";

export interface GetAuditEventsInput {
  readonly page: number;
  readonly filters: AuditEventFilters;
}

export async function getAuditEvents({
  page,
  filters,
}: GetAuditEventsInput): Promise<AuditEventDirectoryResponse> {
  const incomingHeaders = await headers();
  const host = incomingHeaders.get("host");

  if (host === null) {
    throw new Error("Unable to determine the application host.");
  }

  const protocol = incomingHeaders.get("x-forwarded-proto") ?? "http";
  const params = new URLSearchParams({
    page: String(page),
  });

  for (const [name, value] of Object.entries(filters)) {
    if (value) {
      params.set(name, value);
    }
  }

  const response = await fetch(
    `${protocol}://${host}/api/audit-events?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Cookie: incomingHeaders.get("cookie") ?? "",
      },
      cache: "no-store",
    },
  );

  const body: unknown = await response.json();

  if (!response.ok) {
    const detail =
      typeof body === "object" &&
      body !== null &&
      "detail" in body &&
      typeof body.detail === "string"
        ? body.detail
        : "Unable to load audit events.";

    throw new Error(detail);
  }

  return body as AuditEventDirectoryResponse;
}
