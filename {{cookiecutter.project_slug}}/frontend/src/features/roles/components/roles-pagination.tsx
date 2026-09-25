import { AdministrationPagination } from "@/shared/administration/administration-pagination";

interface RolesPaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly search: string;
}

export function RolesPagination({
  page,
  totalPages,
  search,
}: RolesPaginationProps): React.ReactNode {
  return (
    <AdministrationPagination
      basePath="/administration/roles"
      page={page}
      query={[["search", search]]}
      totalPages={totalPages}
    />
  );
}
