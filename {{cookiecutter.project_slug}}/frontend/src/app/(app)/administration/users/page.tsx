import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/api/get-current-user";
import { getUsers } from "@/features/users/api/get-users";
import { UsersPagination } from "@/features/users/components/users-pagination";
import { UsersTable } from "@/features/users/components/users-table";
import { VIEW_USERS_PERMISSION } from "@/shared/config/navigation";

interface UsersPageProps {
  readonly searchParams: Promise<{
    readonly page?: string;
    readonly search?: string;
  }>;
}

function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function UsersPage({
  searchParams,
}: UsersPageProps): Promise<React.ReactNode> {
  const user = await getCurrentUser();

  if (user === null) {
    redirect("/login");
  }

  if (!user.permissions.includes(VIEW_USERS_PERMISSION)) {
    notFound();
  }

  const params = await searchParams;
  const page = parsePage(params.page);
  const search = params.search?.trim() ?? "";

  const directory = await getUsers({
    page,
    search,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Users
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          View application accounts and their current activation status.
        </p>
      </div>

      <form className="flex max-w-xl gap-2" method="GET">
        <label className="sr-only" htmlFor="user-search">
          Search users
        </label>
        <input
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:ring-4"
          defaultValue={search}
          id="user-search"
          name="search"
          placeholder="Search by name or email"
          type="search"
        />
        <button
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          type="submit"
        >
          Search
        </button>
      </form>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {directory.total} {directory.total === 1 ? "user" : "users"}
        </p>
      </div>

      <UsersTable users={directory.results} />

      <UsersPagination
        page={directory.page}
        search={search}
        totalPages={directory.total_pages}
      />
    </div>
  );
}
