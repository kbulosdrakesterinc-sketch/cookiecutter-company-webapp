import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/api/get-current-user";
import { getUser } from "@/features/users/api/get-user";
import { ManageUserForm } from "@/features/users/components/manage-user-form";
import { CHANGE_USERS_PERMISSION } from "@/features/users/permissions";

interface ManageUserPageProps {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

export default async function ManageUserPage({
  params,
}: ManageUserPageProps): Promise<React.ReactNode> {
  const currentUser = await getCurrentUser();

  if (currentUser === null) {
    redirect("/login");
  }

  if (!currentUser.permissions.includes(CHANGE_USERS_PERMISSION)) {
    notFound();
  }

  const { id } = await params;
  const user = await getUser(id);

  if (user === null) {
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
          Manage user
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Update basic account details or deliberately deactivate/reactivate the
          account.
        </p>
      </div>

      <ManageUserForm user={user} />
    </div>
  );
}
