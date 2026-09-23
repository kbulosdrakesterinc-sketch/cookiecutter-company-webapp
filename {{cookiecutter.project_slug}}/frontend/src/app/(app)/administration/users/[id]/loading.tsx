export default function LoadingUserManagementPage(): React.ReactNode {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      <div className="h-96 max-w-2xl animate-pulse rounded-xl bg-slate-100" />
      <span className="sr-only">Loading user management</span>
    </div>
  );
}
