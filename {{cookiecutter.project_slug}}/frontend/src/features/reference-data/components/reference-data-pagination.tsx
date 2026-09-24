import Link from "next/link";

interface ReferenceDataPaginationProps {
  readonly basePath: string;
  readonly page: number;
  readonly totalPages: number;
  readonly search: string;
  readonly isActive: "" | "true" | "false";
}

function buildHref(
  basePath: string,
  page: number,
  search: string,
  isActive: "" | "true" | "false",
): string {
  const params = new URLSearchParams({
    page: String(page),
  });

  if (search) {
    params.set("search", search);
  }

  if (isActive) {
    params.set("is_active", isActive);
  }

  return `${basePath}?${params.toString()}`;
}

export function ReferenceDataPagination({
  basePath,
  page,
  totalPages,
  search,
  isActive,
}: ReferenceDataPaginationProps): React.ReactNode {
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
            href={buildHref(basePath, page - 1, search, isActive)}
          >
            Previous
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            href={buildHref(basePath, page + 1, search, isActive)}
          >
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}
