import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/api/get-current-user";
import { AdministrationPageHeader } from "@/shared/administration/administration-page-header";
import { getReferenceDataSets } from "@/features/reference-data/api/get-reference-data-sets";
import { ReferenceDataPagination } from "@/features/reference-data/components/reference-data-pagination";
import { ReferenceDataSetsTable } from "@/features/reference-data/components/reference-data-sets-table";
import {
  ADD_REFERENCE_DATA_SETS_PERMISSION,
  CHANGE_REFERENCE_DATA_SETS_PERMISSION,
  VIEW_REFERENCE_DATA_PERMISSION,
} from "@/features/reference-data/permissions";

interface ReferenceDataPageProps {
  readonly searchParams: Promise<{
    readonly page?: string;
    readonly search?: string;
    readonly is_active?: string;
  }>;
}

function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseActiveFilter(
  value: string | undefined,
): "" | "true" | "false" {
  return value === "true" || value === "false" ? value : "";
}

export default async function ReferenceDataPage({
  searchParams,
}: ReferenceDataPageProps): Promise<React.ReactNode> {
  const user = await getCurrentUser();

  if (user === null) {
    redirect("/login");
  }

  if (!user.permissions.includes(VIEW_REFERENCE_DATA_PERMISSION)) {
    notFound();
  }

  const params = await searchParams;
  const page = parsePage(params.page);
  const search = params.search?.trim() ?? "";
  const isActive = parseActiveFilter(params.is_active);
  const directory = await getReferenceDataSets({
    page,
    search,
    isActive,
  });
  const canAddSets = user.permissions.includes(
    ADD_REFERENCE_DATA_SETS_PERMISSION,
  );
  const canChangeSets = user.permissions.includes(
    CHANGE_REFERENCE_DATA_SETS_PERMISSION,
  );

  return (
    <div className="space-y-6">
      <AdministrationPageHeader
        action={
          canAddSets ? (
            <Link
              className="inline-flex w-fit items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              href="/administration/reference-data/new"
            >
              Add lookup set
            </Link>
          ) : null
        }
        description="Manage controlled lookup lists that do not encode application workflow rules."
        title="Reference Data"
      />

      <form className="flex max-w-3xl flex-col gap-2 sm:flex-row" method="GET">
        <label className="sr-only" htmlFor="reference-data-search">
          Search reference data
        </label>
        <input
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:ring-4"
          defaultValue={search}
          id="reference-data-search"
          name="search"
          placeholder="Search by code, name, or description"
          type="search"
        />
        <label className="sr-only" htmlFor="reference-data-active">
          Active state
        </label>
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
          defaultValue={isActive}
          id="reference-data-active"
          name="is_active"
        >
          <option value="">All states</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          type="submit"
        >
          Search
        </button>
      </form>

      <p className="text-sm text-slate-500">
        {directory.total} {directory.total === 1 ? "lookup set" : "lookup sets"}
      </p>

      <ReferenceDataSetsTable
        canChangeSets={canChangeSets}
        referenceSets={directory.results}
      />

      <ReferenceDataPagination
        basePath="/administration/reference-data"
        isActive={isActive}
        page={directory.page}
        search={search}
        totalPages={directory.total_pages}
      />
    </div>
  );
}
