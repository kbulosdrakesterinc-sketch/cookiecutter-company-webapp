export default function RolesLoading(): React.ReactNode {
  return (
    <div
      aria-busy="true"
      aria-label="Loading roles"
      className="space-y-6"
    >
      <div>
        <div className="h-8 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
      </div>

      <div className="h-10 w-full max-w-xl animate-pulse rounded-lg bg-slate-200" />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            className="flex gap-6 border-b border-slate-100 px-5 py-5 last:border-b-0"
            key={index}
          >
            <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
            <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
