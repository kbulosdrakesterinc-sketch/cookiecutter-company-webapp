import Link from "next/link";

import { AdministrationEmptyState } from "@/shared/administration/administration-empty-state";

import type { DirectoryRole } from "../types/role-directory";

interface RolesTableProps {
  readonly roles: readonly DirectoryRole[];
}

export function RolesTable({ roles }: RolesTableProps): React.ReactNode {
  if (roles.length === 0) {
    return (
      <AdministrationEmptyState
        description="Try a different search term."
        title="No roles found."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Role
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Users
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Permissions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {roles.map((role) => (
              <tr key={role.id}>
                <td className="px-5 py-4 text-sm font-medium text-slate-950">
                  <Link
                    className="font-semibold text-slate-700 hover:text-slate-950"
                    href={`/administration/roles/${role.id}`}
                  >
                    {role.name}
                  </Link>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {role.user_count}
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {role.permission_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
