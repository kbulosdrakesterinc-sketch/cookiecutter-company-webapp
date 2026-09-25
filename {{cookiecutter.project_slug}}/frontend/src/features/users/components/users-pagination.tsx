import { AdministrationPagination } from "@/shared/administration/administration-pagination";

interface UsersPaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly search: string;
}

export function UsersPagination({
  page,
  totalPages,
  search,
}: UsersPaginationProps): React.ReactNode {
  return (
    <AdministrationPagination
      basePath="/administration/users"
      page={page}
      query={[["search", search]]}
      totalPages={totalPages}
    />
  );
}
