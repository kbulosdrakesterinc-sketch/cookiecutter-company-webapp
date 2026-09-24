import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/api/get-current-user";
import { ReferenceDataSetForm } from "@/features/reference-data/components/reference-data-set-form";
import {
  ADD_REFERENCE_DATA_SETS_PERMISSION,
  VIEW_REFERENCE_DATA_PERMISSION,
} from "@/features/reference-data/permissions";

export default async function NewReferenceDataSetPage(): Promise<React.ReactNode> {
  const user = await getCurrentUser();

  if (user === null) {
    redirect("/login");
  }

  if (
    !user.permissions.includes(VIEW_REFERENCE_DATA_PERMISSION) ||
    !user.permissions.includes(ADD_REFERENCE_DATA_SETS_PERMISSION)
  ) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="text-sm font-medium text-slate-600 hover:text-slate-950"
          href="/administration/reference-data"
        >
          ← Back to reference data
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
          Add lookup set
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Create a fixed-schema collection for reusable controlled values.
        </p>
      </div>

      <ReferenceDataSetForm />
    </div>
  );
}
