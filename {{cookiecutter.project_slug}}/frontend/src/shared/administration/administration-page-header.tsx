interface AdministrationPageHeaderProps {
  readonly title: string;
  readonly description: string;
  readonly action?: React.ReactNode;
}

export function AdministrationPageHeader({
  title,
  description,
  action,
}: AdministrationPageHeaderProps): React.ReactNode {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action ?? null}
    </div>
  );
}
