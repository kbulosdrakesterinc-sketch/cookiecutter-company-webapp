import Link from "next/link";

export type AdministrationPaginationQuery = readonly (readonly [
  name: string,
  value: string,
])[];

interface AdministrationPaginationProps {
  readonly basePath: string;
  readonly page: number;
  readonly totalPages: number;
  readonly query?: AdministrationPaginationQuery;
}

export function buildAdministrationPaginationHref(
  basePath: string,
  page: number,
  query: AdministrationPaginationQuery = [],
): string {
  const params = new URLSearchParams({
    page: String(page),
  });

  for (const [name, value] of query) {
    if (value) {
      params.set(name, value);
    }
  }

  return `${basePath}?${params.toString()}`;
}

export function AdministrationPagination({
  basePath,
  page,
  totalPages,
  query = [],
}: AdministrationPaginationProps): React.ReactNode {
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
            href={buildAdministrationPaginationHref(
              basePath,
              page - 1,
              query,
            )}
          >
            Previous
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            href={buildAdministrationPaginationHref(
              basePath,
              page + 1,
              query,
            )}
          >
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}
