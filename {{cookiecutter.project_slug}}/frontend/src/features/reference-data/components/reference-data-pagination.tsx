import { AdministrationPagination } from "@/shared/administration/administration-pagination";

interface ReferenceDataPaginationProps {
  readonly basePath: string;
  readonly page: number;
  readonly totalPages: number;
  readonly search: string;
  readonly isActive: "" | "true" | "false";
}

export function ReferenceDataPagination({
  basePath,
  page,
  totalPages,
  search,
  isActive,
}: ReferenceDataPaginationProps): React.ReactNode {
  return (
    <AdministrationPagination
      basePath={basePath}
      page={page}
      query={[
        ["search", search],
        ["is_active", isActive],
      ]}
      totalPages={totalPages}
    />
  );
}
