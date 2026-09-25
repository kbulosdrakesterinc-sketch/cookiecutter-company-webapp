interface AdministrationEmptyStateProps {
  readonly title: string;
  readonly description: string;
}

export function AdministrationEmptyState({
  title,
  description,
}: AdministrationEmptyStateProps): React.ReactNode {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
