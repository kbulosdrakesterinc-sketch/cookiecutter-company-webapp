import "server-only";

import { headers } from "next/headers";

import type { ReferenceDataSetDirectoryResponse } from "../types/reference-data";

export interface GetReferenceDataSetsInput {
  readonly page: number;
  readonly search: string;
  readonly isActive: "" | "true" | "false";
}

export async function getReferenceDataSets({
  page,
  search,
  isActive,
}: GetReferenceDataSetsInput): Promise<ReferenceDataSetDirectoryResponse> {
  const incomingHeaders = await headers();
  const host = incomingHeaders.get("host");

  if (host === null) {
    throw new Error("Unable to determine the application host.");
  }

  const protocol = incomingHeaders.get("x-forwarded-proto") ?? "http";
  const params = new URLSearchParams({
    page: String(page),
  });

  if (search) {
    params.set("search", search);
  }

  if (isActive) {
    params.set("is_active", isActive);
  }

  const response = await fetch(
    `${protocol}://${host}/api/reference-data?${params.toString()}`,
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
        : "Unable to load reference data.";

    throw new Error(detail);
  }

  return body as ReferenceDataSetDirectoryResponse;
}
