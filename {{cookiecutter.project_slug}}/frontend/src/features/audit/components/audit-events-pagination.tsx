import Link from "next/link";

import type { AuditEventFilters } from "../types/audit-event";

interface AuditEventsPaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly filters: AuditEventFilters;
}

function buildHref(page: number, filters: AuditEventFilters): string {
  const params = new URLSearchParams({
    page: String(page),
  });

  for (const [name, value] of Object.entries(filters)) {
    if (value) {
      params.set(name, value);
    }
  }

  return `/administration/audit-log?${params.toString()}`;
}

export function AuditEventsPagination({
  page,
  totalPages,
  filters,
}: AuditEventsPaginationProps): React.ReactNode {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-slate-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            href={buildHref(page - 1, filters)}
          >
            Previous
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            href={buildHref(page + 1, filters)}
          >
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}
