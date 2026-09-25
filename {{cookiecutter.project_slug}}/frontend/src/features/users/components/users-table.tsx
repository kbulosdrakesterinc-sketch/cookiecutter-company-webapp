import Link from "next/link";

import { AdministrationEmptyState } from "@/shared/administration/administration-empty-state";

import type { DirectoryUser } from "../types/user-directory";
import { UserStatusBadge } from "./user-status-badge";

interface UsersTableProps {
  readonly users: readonly DirectoryUser[];
  readonly canManageUsers: boolean;
}

function getDisplayName(user: DirectoryUser): string {
  const name = `${user.first_name} ${user.last_name}`.trim();

  return name || "—";
}

export function UsersTable({
  users,
  canManageUsers,
}: UsersTableProps): React.ReactNode {
  if (users.length === 0) {
    return (
      <AdministrationEmptyState
        description="Try a different search term."
        title="No users found"
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
                Name
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Account status
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Joined
              </th>
              {canManageUsers ? (
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-5 py-4 text-sm font-medium text-slate-950">
                  {getDisplayName(user)}
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {user.email}
                </td>
                <td className="px-5 py-4">
                  <UserStatusBadge state={user.account_state} />
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                  }).format(new Date(user.date_joined))}
                </td>
                {canManageUsers ? (
                  <td className="px-5 py-4 text-right text-sm">
                    <Link
                      className="font-semibold text-slate-700 hover:text-slate-950"
                      href={`/administration/users/${user.id}`}
                    >
                      Manage
                    </Link>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
