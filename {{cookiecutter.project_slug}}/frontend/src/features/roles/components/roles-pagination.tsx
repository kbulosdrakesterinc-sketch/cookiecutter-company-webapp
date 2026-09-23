import Link from "next/link";

interface RolesPaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly search: string;
}

function buildHref(page: number, search: string): string {
  const params = new URLSearchParams({
    page: String(page),
  });

  if (search) {
    params.set("search", search);
  }

  return `/administration/roles?${params.toString()}`;
}

export function RolesPagination({
  page,
  totalPages,
  search,
}: RolesPaginationProps): React.ReactNode {
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
            href={buildHref(page - 1, search)}
          >
            Previous
          </Link>
        ) : null}

        {page < totalPages ? (
          <Link
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            href={buildHref(page + 1, search)}
          >
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}
