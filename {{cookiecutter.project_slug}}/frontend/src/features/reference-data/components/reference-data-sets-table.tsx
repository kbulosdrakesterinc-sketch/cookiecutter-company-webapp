import Link from "next/link";

import { AdministrationEmptyState } from "@/shared/administration/administration-empty-state";

import type { ReferenceDataSet } from "../types/reference-data";

interface ReferenceDataSetsTableProps {
  readonly referenceSets: readonly ReferenceDataSet[];
  readonly canChangeSets: boolean;
}

export function ReferenceDataSetsTable({
  referenceSets,
  canChangeSets,
}: ReferenceDataSetsTableProps): React.ReactNode {
  if (referenceSets.length === 0) {
    return (
      <AdministrationEmptyState
        description="Try a different search term or create the first lookup set."
        title="No reference-data sets found."
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
                Code
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Values
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {referenceSets.map((referenceSet) => (
              <tr key={referenceSet.id}>
                <td className="px-5 py-4 font-mono text-xs text-slate-700">
                  {referenceSet.code}
                </td>
                <td className="px-5 py-4 text-sm font-medium text-slate-950">
                  {referenceSet.name}
                </td>
                <td className="px-5 py-4 text-sm">
                  <span
                    className={
                      referenceSet.is_active
                        ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                        : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                    }
                  >
                    {referenceSet.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {referenceSet.value_count}
                </td>
                <td className="px-5 py-4 text-right text-sm">
                  <Link
                    className="font-semibold text-slate-700 hover:text-slate-950"
                    href={`/administration/reference-data/${referenceSet.id}`}
                  >
                    {canChangeSets ? "Manage" : "View"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
