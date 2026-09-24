import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/api/get-current-user";
import { getReferenceDataSet } from "@/features/reference-data/api/get-reference-data-set";
import { getReferenceDataValue } from "@/features/reference-data/api/get-reference-data-value";
import { ReferenceDataValueForm } from "@/features/reference-data/components/reference-data-value-form";
import {
  CHANGE_REFERENCE_DATA_VALUES_PERMISSION,
  VIEW_REFERENCE_DATA_PERMISSION,
} from "@/features/reference-data/permissions";

interface ManageReferenceDataValuePageProps {
  readonly params: Promise<{
    readonly id: string;
    readonly valueId: string;
  }>;
}

export default async function ManageReferenceDataValuePage({
  params,
}: ManageReferenceDataValuePageProps): Promise<React.ReactNode> {
  const user = await getCurrentUser();

  if (user === null) {
    redirect("/login");
  }

  if (
    !user.permissions.includes(VIEW_REFERENCE_DATA_PERMISSION) ||
    !user.permissions.includes(CHANGE_REFERENCE_DATA_VALUES_PERMISSION)
  ) {
    notFound();
  }

  const { id, valueId } = await params;
  const [referenceSet, value] = await Promise.all([
    getReferenceDataSet(id),
    getReferenceDataValue(id, valueId),
  ]);

  if (referenceSet === null || value === null) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="text-sm font-medium text-slate-600 hover:text-slate-950"
          href={`/administration/reference-data/${referenceSet.id}`}
        >
          ← Back to {referenceSet.name}
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
          Manage reference-data value
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Update the descriptive fields, order, or active state. The code
          remains stable.
        </p>
      </div>

      <ReferenceDataValueForm
        referenceSetId={referenceSet.id}
        value={value}
      />
    </div>
  );
}
