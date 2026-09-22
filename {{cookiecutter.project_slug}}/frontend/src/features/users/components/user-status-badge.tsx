import type { UserAccountState } from "../types/user-directory";

const LABELS: Record<UserAccountState, string> = {
  active: "Active",
  inactive: "Inactive",
  pending_activation: "Pending activation",
};

interface UserStatusBadgeProps {
  readonly state: UserAccountState;
}

export function UserStatusBadge({
  state,
}: UserStatusBadgeProps): React.ReactNode {
  const className =
    state === "active"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
      : state === "inactive"
        ? "bg-slate-100 text-slate-700 ring-slate-500/20"
        : "bg-amber-50 text-amber-800 ring-amber-600/20";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {LABELS[state]}
    </span>
  );
}
