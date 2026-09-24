import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/api/get-current-user";
import { getReferenceDataSet } from "@/features/reference-data/api/get-reference-data-set";
import { getReferenceDataValues } from "@/features/reference-data/api/get-reference-data-values";
import { ReferenceDataPagination } from "@/features/reference-data/components/reference-data-pagination";
import { ReferenceDataSetForm } from "@/features/reference-data/components/reference-data-set-form";
import { ReferenceDataValuesTable } from "@/features/reference-data/components/reference-data-values-table";
import {
  ADD_REFERENCE_DATA_VALUES_PERMISSION,
  CHANGE_REFERENCE_DATA_SETS_PERMISSION,
  CHANGE_REFERENCE_DATA_VALUES_PERMISSION,
  VIEW_REFERENCE_DATA_PERMISSION,
} from "@/features/reference-data/permissions";

interface ReferenceDataSetPageProps {
  readonly params: Promise<{
    readonly id: string;
  }>;
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

export default async function ReferenceDataSetPage({
  params,
  searchParams,
}: ReferenceDataSetPageProps): Promise<React.ReactNode> {
  const user = await getCurrentUser();

  if (user === null) {
    redirect("/login");
  }

  if (!user.permissions.includes(VIEW_REFERENCE_DATA_PERMISSION)) {
    notFound();
  }

  const { id } = await params;
  const query = await searchParams;
  const page = parsePage(query.page);
  const search = query.search?.trim() ?? "";
  const isActive = parseActiveFilter(query.is_active);
  const referenceSet = await getReferenceDataSet(id);

  if (referenceSet === null) {
    notFound();
  }

  const values = await getReferenceDataValues({
    referenceSetId: referenceSet.id,
    page,
    search,
    isActive,
  });

  const canChangeSet = user.permissions.includes(
    CHANGE_REFERENCE_DATA_SETS_PERMISSION,
  );
  const canAddValues = user.permissions.includes(
    ADD_REFERENCE_DATA_VALUES_PERMISSION,
  );
  const canChangeValues = user.permissions.includes(
    CHANGE_REFERENCE_DATA_VALUES_PERMISSION,
  );
  const basePath = `/administration/reference-data/${referenceSet.id}`;

  return (
    <div className="space-y-8">
      <div>
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
          <Link
            className="font-medium text-slate-600 hover:text-slate-950"
            href="/administration/reference-data"
          >
            Reference Data
          </Link>
          <span aria-hidden="true" className="text-slate-400">
            /
          </span>
          <span className="text-slate-500">{referenceSet.name}</span>
        </nav>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
          {referenceSet.name}
        </h1>
        <p className="mt-1 font-mono text-xs text-slate-500">
          {referenceSet.code}
        </p>
      </div>

      {canChangeSet ? (
        <section aria-labelledby="lookup-set-heading" className="space-y-3">
          <div>
            <h2
              className="text-lg font-semibold text-slate-950"
              id="lookup-set-heading"
            >
              Lookup set
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              The code is stable; descriptive fields and active state remain
              manageable.
            </p>
          </div>
          <ReferenceDataSetForm referenceSet={referenceSet} />
        </section>
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm leading-6 text-slate-600">
            {referenceSet.description || "No description."}
          </p>
          <p className="mt-3 text-sm font-medium text-slate-700">
            {referenceSet.is_active ? "Active" : "Inactive"}
          </p>
        </section>
      )}

      <section aria-labelledby="lookup-values-heading" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2
              className="text-lg font-semibold text-slate-950"
              id="lookup-values-heading"
            >
              Values
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Controlled values are ordered by sort order, then name and code.
            </p>
          </div>
          {canAddValues ? (
            <Link
              className="inline-flex w-fit items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              href={`${basePath}/values/new`}
            >
              Add value
            </Link>
          ) : null}
        </div>

        <form className="flex max-w-3xl flex-col gap-2 sm:flex-row" method="GET">
          <label className="sr-only" htmlFor="reference-value-search">
            Search values
          </label>
          <input
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:ring-4"
            defaultValue={search}
            id="reference-value-search"
            name="search"
            placeholder="Search by code, name, or description"
            type="search"
          />
          <label className="sr-only" htmlFor="reference-value-active">
            Active state
          </label>
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
            defaultValue={isActive}
            id="reference-value-active"
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
          {values.total} {values.total === 1 ? "value" : "values"}
        </p>

        <ReferenceDataValuesTable
          canChangeValues={canChangeValues}
          referenceSetId={referenceSet.id}
          values={values.results}
        />

        <ReferenceDataPagination
          basePath={basePath}
          isActive={isActive}
          page={values.page}
          search={search}
          totalPages={values.total_pages}
        />
      </section>
    </div>
  );
}
