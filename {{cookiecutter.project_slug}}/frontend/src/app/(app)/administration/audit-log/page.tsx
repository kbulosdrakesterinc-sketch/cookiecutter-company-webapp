import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getAuditEvents } from "@/features/audit/api/get-audit-events";
import { AuditEventsPagination } from "@/features/audit/components/audit-events-pagination";
import { AuditEventsTable } from "@/features/audit/components/audit-events-table";
import { VIEW_AUDIT_EVENTS_PERMISSION } from "@/features/audit/permissions";
import type { AuditEventFilters } from "@/features/audit/types/audit-event";
import { getCurrentUser } from "@/features/auth/api/get-current-user";

interface AuditLogPageProps {
  readonly searchParams: Promise<{
    readonly action?: string;
    readonly target_type?: string;
    readonly actor?: string;
    readonly occurred_after?: string;
    readonly occurred_before?: string;
    readonly page?: string;
  }>;
}

function parsePage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "1", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function normalizeFilters(
  params: Awaited<AuditLogPageProps["searchParams"]>,
): AuditEventFilters {
  return {
    action: params.action?.trim() ?? "",
    target_type: params.target_type?.trim() ?? "",
    actor: params.actor?.trim() ?? "",
    occurred_after: params.occurred_after?.trim() ?? "",
    occurred_before: params.occurred_before?.trim() ?? "",
  };
}

export default async function AuditLogPage({
  searchParams,
}: AuditLogPageProps): Promise<React.ReactNode> {
  const user = await getCurrentUser();

  if (user === null) {
    redirect("/login");
  }

  if (!user.permissions.includes(VIEW_AUDIT_EVENTS_PERMISSION)) {
    notFound();
  }

  const params = await searchParams;
  const page = parsePage(params.page);
  const filters = normalizeFilters(params);
  const directory = await getAuditEvents({ page, filters });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Audit Log
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Review structured Administration audit events. This directory is
          read-only.
        </p>
      </div>

      <form
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"
        method="GET"
      >
        <label className="space-y-1 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Action</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:ring-4"
            defaultValue={filters.action}
            name="action"
            placeholder="admin.user.updated"
            type="text"
          />
        </label>
        <label className="space-y-1 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Target type</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:ring-4"
            defaultValue={filters.target_type}
            name="target_type"
            placeholder="accounts.user"
            type="text"
          />
        </label>
        <label className="space-y-1 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Actor</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none ring-slate-900/10 placeholder:text-slate-400 focus:ring-4"
            defaultValue={filters.actor}
            name="actor"
            placeholder="admin@example.com"
            type="search"
          />
        </label>
        <label className="space-y-1 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Occurred after</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none ring-slate-900/10 focus:ring-4"
            defaultValue={filters.occurred_after}
            name="occurred_after"
            type="datetime-local"
          />
        </label>
        <label className="space-y-1 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Occurred before</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none ring-slate-900/10 focus:ring-4"
            defaultValue={filters.occurred_before}
            name="occurred_before"
            type="datetime-local"
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            type="submit"
          >
            Apply filters
          </button>
          <Link
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            href="/administration/audit-log"
          >
            Clear
          </Link>
        </div>
      </form>

      <p className="text-sm text-slate-500">
        {directory.total} {directory.total === 1 ? "event" : "events"}
      </p>

      <AuditEventsTable events={directory.results} />

      <AuditEventsPagination
        filters={filters}
        page={directory.page}
        totalPages={directory.total_pages}
      />
    </div>
  );
}
