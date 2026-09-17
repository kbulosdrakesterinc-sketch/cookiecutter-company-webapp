import type { AuthUser } from "@/features/auth/types/auth-user";

interface UserSummaryProps {
  readonly user: AuthUser;
}

function getDisplayName(user: AuthUser): string {
  const fullName = [user.first_name, user.last_name]
    .filter((value) => value.trim().length > 0)
    .join(" ");

  return fullName || user.email;
}

function getInitials(user: AuthUser): string {
  const initials = [user.first_name, user.last_name]
    .filter((value) => value.trim().length > 0)
    .map((value) => value.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  return initials || user.email.charAt(0).toUpperCase();
}

export function UserSummary({ user }: UserSummaryProps): React.ReactNode {
  return (
    <div className="flex items-center gap-3">
      <div
        aria-hidden="true"
        className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white"
      >
        {getInitials(user)}
      </div>

      <div className="hidden min-w-0 sm:block">
        <p className="truncate text-sm font-semibold text-slate-900">
          {getDisplayName(user)}
        </p>
        <p className="truncate text-xs text-slate-500">{user.email}</p>
      </div>
    </div>
  );
}
