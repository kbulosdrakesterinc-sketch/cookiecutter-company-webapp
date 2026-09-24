export default function AuditLogLoading(): React.ReactNode {
  return (
    <div
      aria-busy="true"
      aria-label="Loading audit events"
      className="space-y-6"
    >
      <div>
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
      </div>
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            className="h-10 animate-pulse rounded-lg bg-slate-100"
            key={index}
          />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            className="flex gap-6 border-b border-slate-100 px-5 py-5 last:border-b-0"
            key={index}
          >
            <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-44 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
