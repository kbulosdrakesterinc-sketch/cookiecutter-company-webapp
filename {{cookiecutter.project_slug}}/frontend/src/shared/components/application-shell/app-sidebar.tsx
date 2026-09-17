import { applicationNavigation } from "@/shared/config/navigation";

import { NavigationLink } from "./navigation-link";

export function AppSidebar(): React.ReactNode {
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
        className="flex-1 space-y-1 overflow-y-auto px-4 py-6"
      >
        {applicationNavigation.map((item) => (
          <NavigationLink item={item} key={item.href} />
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
