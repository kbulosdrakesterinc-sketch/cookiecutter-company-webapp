"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  RoleMembershipError,
  searchRoleMembershipCandidates,
  updateRoleMembership,
} from "../api/role-membership";
import type { RoleDetail, RoleDetailUser } from "../types/role-detail";

interface RoleMembershipManagerProps {
  readonly role: RoleDetail;
}

function getDisplayName(user: RoleDetailUser): string {
  const name = `${user.first_name} ${user.last_name}`.trim();

  return name || "—";
}

function countLabel(count: number, singular: string): string {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

function getMembershipErrorMessage(error: RoleMembershipError): string {
  return (
    error.fieldErrors.addUserIds?.[0] ??
    error.fieldErrors.removeUserIds?.[0] ??
    error.fieldErrors.userIds?.[0] ??
    error.message
  );
}

function StatusBadge({
  isActive,
}: {
  readonly isActive: boolean;
}): React.ReactNode {
  return (
    <span
      className={
        isActive
          ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
          : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
      }
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export function RoleMembershipManager({
  role,
}: RoleMembershipManagerProps): React.ReactNode {
  const router = useRouter();
  const [members, setMembers] = useState<readonly RoleDetailUser[]>(role.users);
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState<readonly RoleDetailUser[]>([]);
  const [candidateTotal, setCandidateTotal] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSearch(
    event: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const normalizedSearch = search.trim();

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!normalizedSearch) {
      setCandidates([]);
      setCandidateTotal(0);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await searchRoleMembershipCandidates(
        role.id,
        normalizedSearch,
      );

      setCandidates(response.results);
      setCandidateTotal(response.total);
    } catch (error: unknown) {
      setCandidates([]);
      setCandidateTotal(0);

      if (error instanceof RoleMembershipError) {
        setErrorMessage(getMembershipErrorMessage(error));
      } else {
        setErrorMessage("Unable to search users.");
      }
    } finally {
      setIsSearching(false);
    }
  }

  async function addMember(user: RoleDetailUser): Promise<void> {
    setPendingUserId(user.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedRole = await updateRoleMembership(role.id, {
        addUserIds: [user.id],
      });

      setMembers(updatedRole.users);
      setCandidates((current) =>
        current.filter((candidate) => candidate.id !== user.id),
      );
      setCandidateTotal((current) => Math.max(0, current - 1));
      setSuccessMessage(`${user.email} was added to this role.`);
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof RoleMembershipError) {
        setErrorMessage(getMembershipErrorMessage(error));
      } else {
        setErrorMessage("Unable to add this user to the role.");
      }
    } finally {
      setPendingUserId(null);
    }
  }

  async function removeMember(user: RoleDetailUser): Promise<void> {
    setPendingUserId(user.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedRole = await updateRoleMembership(role.id, {
        removeUserIds: [user.id],
      });

      setMembers(updatedRole.users);
      setSuccessMessage(`${user.email} was removed from this role.`);
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof RoleMembershipError) {
        setErrorMessage(getMembershipErrorMessage(error));
      } else {
        setErrorMessage("Unable to remove this user from the role.");
      }
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <section aria-labelledby="role-users-heading" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            className="text-lg font-semibold text-slate-950"
            id="role-users-heading"
          >
            Assigned users
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Add or remove direct members of this Django role.
          </p>
        </div>
        <p className="text-sm text-slate-500">
          {countLabel(members.length, "user")}
        </p>
      </div>

      {errorMessage !== null ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      {successMessage !== null ? (
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
          role="status"
        >
          {successMessage}
        </div>
      ) : null}

      {members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
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
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((user) => (
                  <tr key={user.id}>
                    <td className="px-5 py-4 text-sm font-medium text-slate-950">
                      {getDisplayName(user)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {user.email}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <StatusBadge isActive={user.is_active} />
                    </td>
                    <td className="px-5 py-4 text-right text-sm">
                      <button
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={pendingUserId !== null}
                        onClick={() => void removeMember(user)}
                        type="button"
                      >
                        {pendingUserId === user.id ? "Removing..." : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Add users</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Search by name or email. Existing members are excluded from results.
          </p>
        </div>

        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={handleSearch}
        >
          <label className="sr-only" htmlFor="role-member-search">
            Search users
          </label>
          <input
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-500"
            id="role-member-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email"
            type="search"
            value={search}
          />
          <button
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSearching || pendingUserId !== null}
            type="submit"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>

        {!hasSearched ? (
          <p className="mt-4 text-sm text-slate-500">
            Search to find users who can be added to this role.
          </p>
        ) : candidates.length === 0 && !isSearching ? (
          <p className="mt-4 text-sm text-slate-500">
            No matching users are available to add.
          </p>
        ) : candidates.length > 0 ? (
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-700">
                {countLabel(candidateTotal, "match")}
              </p>
              {candidateTotal > candidates.length ? (
                <p className="text-xs text-slate-500">
                  Showing the first {candidates.length}. Refine your search to
                  narrow the results.
                </p>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {candidates.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-950">
                          {getDisplayName(user)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <StatusBadge isActive={user.is_active} />
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          <button
                            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={pendingUserId !== null}
                            onClick={() => void addMember(user)}
                            type="button"
                          >
                            {pendingUserId === user.id ? "Adding..." : "Add"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
