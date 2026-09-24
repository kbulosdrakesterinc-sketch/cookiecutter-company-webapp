import { describe, expect, it } from "vitest";

import type { RoleDetailPermission } from "./types/role-detail";
import { groupRolePermissions } from "./permission-groups";

const permissions: readonly RoleDetailPermission[] = [
  {
    id: 3,
    name: "Can view group",
    codename: "view_group",
    app_label: "auth",
    model: "group",
    permission: "auth.view_group",
  },
  {
    id: 2,
    name: "Can change user",
    codename: "change_user",
    app_label: "accounts",
    model: "user",
    permission: "accounts.change_user",
  },
  {
    id: 1,
    name: "Can view user",
    codename: "view_user",
    app_label: "accounts",
    model: "user",
    permission: "accounts.view_user",
  },
];

describe("groupRolePermissions", () => {
  it("groups permissions by app label and model", () => {
    const groups = groupRolePermissions(permissions);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.key).toBe("accounts:user");
    expect(groups[0]?.permissions.map((permission) => permission.id)).toEqual([
      2,
      1,
    ]);
    expect(groups[1]?.key).toBe("auth:group");
  });

  it("does not mutate the source permission array", () => {
    const originalOrder = permissions.map((permission) => permission.id);

    groupRolePermissions(permissions);

    expect(permissions.map((permission) => permission.id)).toEqual(
      originalOrder,
    );
  });
});
