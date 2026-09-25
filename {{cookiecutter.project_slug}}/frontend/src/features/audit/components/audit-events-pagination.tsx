import { AdministrationPagination } from "@/shared/administration/administration-pagination";

import type { AuditEventFilters } from "../types/audit-event";

interface AuditEventsPaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly filters: AuditEventFilters;
}

export function AuditEventsPagination({
  page,
  totalPages,
  filters,
}: AuditEventsPaginationProps): React.ReactNode {
  return (
    <AdministrationPagination
      basePath="/administration/audit-log"
      page={page}
      query={[
        ["action", filters.action],
        ["target_type", filters.target_type],
        ["actor", filters.actor],
        ["occurred_after", filters.occurred_after],
        ["occurred_before", filters.occurred_before],
      ]}
      totalPages={totalPages}
    />
  );
}
