import "server-only";

import { headers } from "next/headers";

import type { ReferenceDataSet } from "../types/reference-data";

export async function getReferenceDataSet(
  referenceSetId: string,
): Promise<ReferenceDataSet | null> {
  const incomingHeaders = await headers();
  const host = incomingHeaders.get("host");

  if (host === null) {
    throw new Error("Unable to determine the application host.");
  }

  const protocol = incomingHeaders.get("x-forwarded-proto") ?? "http";
  const response = await fetch(
    `${protocol}://${host}/api/reference-data/${encodeURIComponent(referenceSetId)}`,
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

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const detail =
      typeof body === "object" &&
      body !== null &&
      "detail" in body &&
      typeof body.detail === "string"
        ? body.detail
        : "Unable to load the reference-data set.";

    throw new Error(detail);
  }

  return body as ReferenceDataSet;
}
