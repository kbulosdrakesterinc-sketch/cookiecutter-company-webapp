function SkeletonCard(): React.ReactNode {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
      <div className="h-4 w-28 rounded bg-slate-200" />

      <div className="mt-4 h-9 w-20 rounded bg-slate-200" />

      <div className="mt-3 h-4 w-full rounded bg-slate-100" />

      <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
    </div>
  );
}

export default function DashboardLoading(): React.ReactNode {
  return (
    <div aria-busy="true" aria-label="Loading dashboard" className="space-y-8">
      <div className="h-52 animate-pulse rounded-2xl bg-slate-200" />

      <div>
        <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
