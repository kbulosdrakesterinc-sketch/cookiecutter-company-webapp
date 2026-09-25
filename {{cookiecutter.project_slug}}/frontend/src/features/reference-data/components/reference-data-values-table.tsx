import Link from "next/link";

import { AdministrationEmptyState } from "@/shared/administration/administration-empty-state";

import type { ReferenceDataValue } from "../types/reference-data";

interface ReferenceDataValuesTableProps {
  readonly referenceSetId: string;
  readonly values: readonly ReferenceDataValue[];
  readonly canChangeValues: boolean;
}

export function ReferenceDataValuesTable({
  referenceSetId,
  values,
  canChangeValues,
}: ReferenceDataValuesTableProps): React.ReactNode {
  if (values.length === 0) {
    return (
      <AdministrationEmptyState
        description="Try a different search term or add the first value."
        title="No reference-data values found."
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
                Order
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Code
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Name
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              {canChangeValues ? (
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {values.map((value) => (
              <tr key={value.id}>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {value.sort_order}
                </td>
                <td className="px-5 py-4 font-mono text-xs text-slate-700">
                  {value.code}
                </td>
                <td className="px-5 py-4 text-sm font-medium text-slate-950">
                  {value.name}
                </td>
                <td className="px-5 py-4 text-sm">
                  <span
                    className={
                      value.is_active
                        ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                        : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                    }
                  >
                    {value.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                {canChangeValues ? (
                  <td className="px-5 py-4 text-right text-sm">
                    <Link
                      className="font-semibold text-slate-700 hover:text-slate-950"
                      href={`/administration/reference-data/${referenceSetId}/values/${value.id}`}
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
