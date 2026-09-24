import type { RoleDetailPermission } from "./types/role-detail";

export interface RolePermissionGroup {
  readonly key: string;
  readonly appLabel: string;
  readonly model: string;
  readonly permissions: readonly RoleDetailPermission[];
}

export function groupRolePermissions(
  permissions: readonly RoleDetailPermission[],
): readonly RolePermissionGroup[] {
  const sortedPermissions = [...permissions].sort((left, right) => {
    const leftKey = `${left.app_label}\u0000${left.model}\u0000${left.codename}`;
    const rightKey = `${right.app_label}\u0000${right.model}\u0000${right.codename}`;
    const keyComparison = leftKey.localeCompare(rightKey);

    return keyComparison !== 0 ? keyComparison : left.id - right.id;
  });

  const groups = new Map<string, RoleDetailPermission[]>();

  for (const permission of sortedPermissions) {
    const key = `${permission.app_label}:${permission.model}`;
    const group = groups.get(key);

    if (group === undefined) {
      groups.set(key, [permission]);
    } else {
      group.push(permission);
    }
  }

  return Array.from(groups, ([key, groupedPermissions]) => ({
    key,
    appLabel: groupedPermissions[0]?.app_label ?? "",
    model: groupedPermissions[0]?.model ?? "",
    permissions: groupedPermissions,
  }));
}
