import type { DirectoryRole } from "../types/role-directory";

interface RolesTableProps {
  readonly roles: readonly DirectoryRole[];
}

export function RolesTable({ roles }: RolesTableProps): React.ReactNode {
  if (roles.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <h2 className="text-sm font-semibold text-slate-950">No roles found.</h2>
        <p className="mt-1 text-sm text-slate-500">
          Try a different search term.
        </p>
      </div>
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
                  {role.name}
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
