export default function RoleDetailLoading(): React.ReactNode {
  return (
    <div aria-busy="true" aria-label="Loading role details" className="space-y-8">
      <div>
        <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
      </div>

      {Array.from({ length: 2 }, (_, sectionIndex) => (
        <div className="space-y-3" key={sectionIndex}>
          <div className="flex items-center justify-between gap-4">
            <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {Array.from({ length: 4 }, (_, rowIndex) => (
              <div
                className="flex gap-6 border-b border-slate-100 px-5 py-5 last:border-b-0"
                key={rowIndex}
              >
                <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-56 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
