import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/api/get-current-user";
import { getReferenceDataSet } from "@/features/reference-data/api/get-reference-data-set";
import { ReferenceDataValueForm } from "@/features/reference-data/components/reference-data-value-form";
import {
  ADD_REFERENCE_DATA_VALUES_PERMISSION,
  VIEW_REFERENCE_DATA_PERMISSION,
} from "@/features/reference-data/permissions";

interface NewReferenceDataValuePageProps {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

export default async function NewReferenceDataValuePage({
  params,
}: NewReferenceDataValuePageProps): Promise<React.ReactNode> {
  const user = await getCurrentUser();

  if (user === null) {
    redirect("/login");
  }

  if (
    !user.permissions.includes(VIEW_REFERENCE_DATA_PERMISSION) ||
    !user.permissions.includes(ADD_REFERENCE_DATA_VALUES_PERMISSION)
  ) {
    notFound();
  }

  const { id } = await params;
  const referenceSet = await getReferenceDataSet(id);

  if (referenceSet === null) {
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
          Add reference-data value
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Add a controlled value to {referenceSet.name}.
        </p>
      </div>

      <ReferenceDataValueForm referenceSetId={referenceSet.id} />
    </div>
  );
}
