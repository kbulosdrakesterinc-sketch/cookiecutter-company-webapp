interface DashboardStatCardProps {
  readonly description: string;
  readonly label: string;
  readonly value: number | string;
}

export function DashboardStatCard({
  description,
  label,
  value,
}: DashboardStatCardProps): React.ReactNode {
  const formattedValue =
    typeof value === "number" ? value.toLocaleString() : value;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>

      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
        {formattedValue}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </article>
  );
}
