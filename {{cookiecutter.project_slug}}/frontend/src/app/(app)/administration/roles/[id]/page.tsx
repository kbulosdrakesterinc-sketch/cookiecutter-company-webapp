import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/api/get-current-user";
import { getRole } from "@/features/roles/api/get-role";
import { getRolePermissions } from "@/features/roles/api/get-role-permissions";
import { RoleManagementForm } from "@/features/roles/components/role-management-form";
import { RoleMembershipManager } from "@/features/roles/components/role-membership-manager";
import {
  CHANGE_ROLES_PERMISSION,
  VIEW_ROLES_PERMISSION,
} from "@/features/roles/permissions";
import type { RoleDetailUser } from "@/features/roles/types/role-detail";

interface RoleDetailPageProps {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

function getDisplayName(user: RoleDetailUser): string {
  const name = `${user.first_name} ${user.last_name}`.trim();

  return name || "—";
}

function countLabel(count: number, singular: string): string {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

export default async function RoleDetailPage({
  params,
}: RoleDetailPageProps): Promise<React.ReactNode> {
  const currentUser = await getCurrentUser();

  if (currentUser === null) {
    redirect("/login");
  }

  if (!currentUser.permissions.includes(VIEW_ROLES_PERMISSION)) {
    notFound();
  }

  const { id } = await params;
  const role = await getRole(id);

  if (role === null) {
    notFound();
  }

  const canManageRole = currentUser.permissions.includes(
    CHANGE_ROLES_PERMISSION,
  );
  const availablePermissions = canManageRole
    ? await getRolePermissions()
    : [];

  return (
    <div className="space-y-8">
      <div>
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
          <Link
            className="font-medium text-slate-600 hover:text-slate-950"
            href="/administration/roles"
          >
            Roles
          </Link>
          <span aria-hidden="true" className="text-slate-400">
            /
          </span>
          <span className="text-slate-500">{role.name}</span>
        </nav>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
          {role.name}
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          {canManageRole
            ? "Manage this role's name, direct permissions, and assigned users."
            : "Read-only role membership and directly assigned permissions."}
        </p>
      </div>

      {canManageRole ? (
        <section aria-labelledby="role-management-heading" className="space-y-3">
          <div>
            <h2
              className="text-lg font-semibold text-slate-950"
              id="role-management-heading"
            >
              Edit role
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Rename the role or replace its direct Django permissions.
            </p>
          </div>
          <RoleManagementForm
            availablePermissions={availablePermissions}
            role={role}
          />
        </section>
      ) : null}

      {canManageRole ? (
        <RoleMembershipManager role={role} />
      ) : (
        <section aria-labelledby="role-users-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2
              className="text-lg font-semibold text-slate-950"
              id="role-users-heading"
            >
              Assigned users
            </h2>
            <p className="text-sm text-slate-500">
              {countLabel(role.users.length, "user")}
            </p>
          </div>

          {role.users.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
              No users are directly assigned to this role.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Name
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Email
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {role.users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-5 py-4 text-sm font-medium text-slate-950">
                          {getDisplayName(user)}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {user.email}
                        </td>
                        <td className="px-5 py-4 text-sm">
                          <span
                            className={
                              user.is_active
                                ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                            }
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      <section aria-labelledby="role-permissions-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2
            className="text-lg font-semibold text-slate-950"
            id="role-permissions-heading"
          >
            Direct permissions
          </h2>
          <p className="text-sm text-slate-500">
            {countLabel(role.permissions.length, "permission")}
          </p>
        </div>

        {role.permissions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
            No permissions are directly assigned to this role.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Application
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Model
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Permission
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {role.permissions.map((permission) => (
                    <tr key={permission.id}>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {permission.app_label}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {permission.model}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-950">
                        {permission.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
