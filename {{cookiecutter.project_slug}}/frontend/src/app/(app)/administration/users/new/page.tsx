import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/api/get-current-user";
import { ProvisionUserForm } from "@/features/users/components/provision-user-form";
import {
  ADD_USERS_PERMISSION,
  VIEW_USERS_PERMISSION,
} from "@/features/users/permissions";

export default async function NewUserPage(): Promise<React.ReactNode> {
  const user = await getCurrentUser();

  if (user === null) {
    redirect("/login");
  }

  if (
    !user.permissions.includes(VIEW_USERS_PERMISSION) ||
    !user.permissions.includes(ADD_USERS_PERMISSION)
  ) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="text-sm font-medium text-slate-600 hover:text-slate-950"
          href="/administration/users"
        >
          ← Back to users
        </Link>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
          Add user
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Provision an account that will complete the existing activation flow
          before signing in.
        </p>
      </div>

      <ProvisionUserForm />
    </div>
  );
}
