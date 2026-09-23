import "server-only";

import { headers } from "next/headers";

import { parseRoleId } from "../role-id";
import type { RoleDetail } from "../types/role-detail";

export async function getRole(roleIdValue: string): Promise<RoleDetail | null> {
  const roleId = parseRoleId(roleIdValue);

  if (roleId === null) {
    return null;
  }

  const incomingHeaders = await headers();
  const host = incomingHeaders.get("host");

  if (host === null) {
    throw new Error("Unable to determine the application host.");
  }

  const protocol = incomingHeaders.get("x-forwarded-proto") ?? "http";
  const response = await fetch(`${protocol}://${host}/api/roles/${roleId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Cookie: incomingHeaders.get("cookie") ?? "",
    },
    cache: "no-store",
  });

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
        : "Unable to load role.";

    throw new Error(detail);
  }

  return body as RoleDetail;
}
