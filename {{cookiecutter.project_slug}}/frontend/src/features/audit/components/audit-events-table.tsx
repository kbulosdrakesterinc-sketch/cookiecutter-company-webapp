import type { AuditEvent } from "../types/audit-event";
import { StructuredData } from "./structured-data";

interface AuditEventsTableProps {
  readonly events: readonly AuditEvent[];
}

function formatTimestamp(value: string): string {
  return value.replace("T", " ");
}

export function AuditEventsTable({
  events,
}: AuditEventsTableProps): React.ReactNode {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <h2 className="text-sm font-semibold text-slate-950">
          No audit events found.
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Try adjusting the current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Timestamp
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actor
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Action
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Target
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Changes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 align-top">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                  <time dateTime={event.occurred_at}>
                    {formatTimestamp(event.occurred_at)}
                  </time>
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {event.actor_identifier || "—"}
                </td>
                <td className="px-5 py-4 text-sm">
                  <code className="text-xs text-slate-700">{event.action}</code>
                </td>
                <td className="px-5 py-4 text-sm">
                  <p className="font-medium text-slate-950">
                    {event.target_display || event.target_id}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {event.target_type} · {event.target_id}
                  </p>
                </td>
                <td className="min-w-80 px-5 py-4 text-xs">
                  {Object.keys(event.changes).length === 0 ? (
                    <span className="text-slate-400">No structured changes</span>
                  ) : (
                    <StructuredData value={event.changes} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
