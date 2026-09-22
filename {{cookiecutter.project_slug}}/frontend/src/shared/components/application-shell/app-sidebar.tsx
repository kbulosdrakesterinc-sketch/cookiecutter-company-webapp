import type { AuthUser } from "@/features/auth/types/auth-user";
import { getVisibleNavigation } from "@/shared/config/navigation";

import { NavigationLink } from "./navigation-link";

interface AppSidebarProps {
  readonly user: AuthUser;
}

export function AppSidebar({ user }: AppSidebarProps): React.ReactNode {
  const navigation = getVisibleNavigation(user);

  return (
    <aside className="hidden border-r border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <div>
          <p className="text-lg font-bold tracking-tight text-slate-950">
            {{ cookiecutter.project_name }}
          </p>

          <p className="text-xs text-slate-500">Internal application</p>
        </div>
      </div>

      <nav
        aria-label="Primary navigation"
        className="flex-1 space-y-6 overflow-y-auto px-4 py-6"
      >
        {navigation.map((section, sectionIndex) => (
          <div key={section.label ?? `section-${sectionIndex}`}>
            {section.label ? (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {section.label}
              </p>
            ) : null}

            <div className="space-y-1">
              {section.items.map((item) => (
                <NavigationLink item={item} key={item.href} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 px-6 py-4">
        <p className="text-xs leading-5 text-slate-500">
          Secure internal application
        </p>
      </div>
    </aside>
  );
}
