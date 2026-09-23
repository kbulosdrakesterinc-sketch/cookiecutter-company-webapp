export function parseRoleId(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const roleId = Number(value);

  if (!Number.isSafeInteger(roleId) || roleId <= 0) {
    return null;
  }

  return roleId;
}
