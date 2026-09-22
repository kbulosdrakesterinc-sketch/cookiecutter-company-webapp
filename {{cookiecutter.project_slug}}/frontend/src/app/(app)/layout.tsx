import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/api/get-current-user";

import { AppHeader } from "@/shared/components/application-shell/app-header";
import { AppSidebar } from "@/shared/components/application-shell/app-sidebar";

interface AuthenticatedLayoutProps {
  readonly children: React.ReactNode;
}

export default async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps): Promise<React.ReactNode> {
  const user = await getCurrentUser();

  if (user === null) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppSidebar user={user} />

      <div className="lg:pl-72">
        <AppHeader user={user} />

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
