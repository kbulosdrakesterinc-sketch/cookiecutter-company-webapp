import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/api/get-current-user";
import { getRolePermissions } from "@/features/roles/api/get-role-permissions";
import { RoleManagementForm } from "@/features/roles/components/role-management-form";
import {
  ADD_ROLES_PERMISSION,
  VIEW_ROLES_PERMISSION,
} from "@/features/roles/permissions";

export default async function NewRolePage(): Promise<React.ReactNode> {
  const user = await getCurrentUser();

  if (user === null) {
    redirect("/login");
  }

  if (
    !user.permissions.includes(VIEW_ROLES_PERMISSION) ||
    !user.permissions.includes(ADD_ROLES_PERMISSION)
  ) {
    notFound();
  }

  const permissions = await getRolePermissions();

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="text-sm font-medium text-slate-600 hover:text-slate-950"
          href="/administration/roles"
        >
          ← Back to roles
        </Link>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
          Add role
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Create a Django Group and optionally assign its direct permissions.
        </p>
      </div>

      <RoleManagementForm availablePermissions={permissions} />
    </div>
  );
}
