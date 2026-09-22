import "server-only";

import { headers } from "next/headers";

import type { UserDirectoryResponse } from "../types/user-directory";

export interface GetUsersInput {
  readonly page: number;
  readonly search: string;
}

export async function getUsers({
  page,
  search,
}: GetUsersInput): Promise<UserDirectoryResponse> {
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

  const response = await fetch(
    `${protocol}://${host}/api/users?${params.toString()}`,
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
        : "Unable to load users.";

    throw new Error(detail);
  }

  return body as UserDirectoryResponse;
}
