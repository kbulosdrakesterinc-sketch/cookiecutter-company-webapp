import { describe, expect, it } from "vitest";

import type { AuthUser } from "@/features/auth/types/auth-user";
import { VIEW_ROLES_PERMISSION } from "@/features/roles/permissions";
import { VIEW_USERS_PERMISSION } from "@/features/users/permissions";

import { getVisibleNavigation } from "./navigation";

function buildUser(permissions: readonly string[]): AuthUser {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    email: "user@example.com",
    first_name: "Test",
    last_name: "User",
    is_staff: false,
    is_superuser: false,
    roles: [],
    permissions,
  };
}

describe("getVisibleNavigation", () => {
  it("hides administration when the user lacks permission", () => {
    const sections = getVisibleNavigation(buildUser([]));

    expect(sections).toHaveLength(1);
    expect(sections[0]?.items[0]?.href).toBe("/dashboard");
  });

  it("shows Users when accounts.view_user is present", () => {
    const sections = getVisibleNavigation(
      buildUser([VIEW_USERS_PERMISSION]),
    );

    expect(
      sections.flatMap((section) => section.items).map((item) => item.href),
    ).toContain("/administration/users");
  });

  it("hides Roles when auth.view_group is absent", () => {
    const sections = getVisibleNavigation(
      buildUser([VIEW_USERS_PERMISSION]),
    );

    expect(
      sections.flatMap((section) => section.items).map((item) => item.href),
    ).not.toContain("/administration/roles");
  });

  it("shows Roles when auth.view_group is present", () => {
    const sections = getVisibleNavigation(
      buildUser([VIEW_ROLES_PERMISSION]),
    );

    expect(
      sections.flatMap((section) => section.items).map((item) => item.href),
    ).toContain("/administration/roles");
  });
});
