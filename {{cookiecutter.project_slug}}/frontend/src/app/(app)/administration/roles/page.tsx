import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/api/get-current-user";
import { getRoles } from "@/features/roles/api/get-roles";
import { RolesPagination } from "@/features/roles/components/roles-pagination";
import { RolesTable } from "@/features/roles/components/roles-table";
import { VIEW_ROLES_PERMISSION } from "@/features/roles/permissions";

interface RolesPageProps {
  readonly searchParams: Promise<{
    readonly page?: string;
    readonly search?: string;
  }>;
}

function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function RolesPage({
  searchParams,
}: RolesPageProps): Promise<React.ReactNode> {
  const user = await getCurrentUser();

  if (user === null) {
    redirect("/login");
  }

  if (!user.permissions.includes(VIEW_ROLES_PERMISSION)) {
    notFound();
  }

  const params = await searchParams;
  const page = parsePage(params.page);
  const search = params.search?.trim() ?? "";

  const directory = await getRoles({
    page,
    search,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Roles
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          View reusable application roles and their current memberships and
          permissions.
        </p>
      </div>

      <form className="flex max-w-xl gap-2" method="GET">
        <label className="sr-only" htmlFor="role-search">
          Search roles
        </label>
        <input
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:ring-4"
          defaultValue={search}
          id="role-search"
          name="search"
          placeholder="Search by role name"
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
          {directory.total} {directory.total === 1 ? "role" : "roles"}
        </p>
      </div>

      <RolesTable roles={directory.results} />

      <RolesPagination
        page={directory.page}
        search={search}
        totalPages={directory.total_pages}
      />
    </div>
  );
}
