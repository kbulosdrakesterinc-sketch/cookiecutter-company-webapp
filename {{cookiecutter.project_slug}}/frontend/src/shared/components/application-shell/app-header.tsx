import type { AuthUser } from "@/features/auth/types/auth-user";

import { LogoutButton } from "@/features/auth/components/LogoutButton";

import { MobileNavigation } from "./mobile-navigation";
import { UserSummary } from "./user-summary";

interface AppHeaderProps {
  readonly user: AuthUser;
}

export function AppHeader({
  user,
}: AppHeaderProps): React.ReactNode {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <MobileNavigation />

          <div>
            <p className="text-sm font-semibold text-slate-950">
              {{ cookiecutter.project_name }}
            </p>

            <p className="hidden text-xs text-slate-500 sm:block">
              Internal application
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <UserSummary user={user} />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
