"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createReferenceDataSet,
  ReferenceDataManagementError,
  updateReferenceDataSet,
} from "../api/reference-data-management";
import type { ReferenceDataSet } from "../types/reference-data";
import type { ReferenceDataFieldErrors } from "../types/reference-data-management";

interface ReferenceDataSetFormProps {
  readonly referenceSet?: ReferenceDataSet;
}

export function ReferenceDataSetForm({
  referenceSet,
}: ReferenceDataSetFormProps): React.ReactNode {
  const router = useRouter();
  const [code, setCode] = useState(referenceSet?.code ?? "");
  const [name, setName] = useState(referenceSet?.name ?? "");
  const [description, setDescription] = useState(
    referenceSet?.description ?? "",
  );
  const [isActive, setIsActive] = useState(referenceSet?.is_active ?? true);
  const [fieldErrors, setFieldErrors] =
    useState<ReferenceDataFieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = referenceSet !== undefined;

  function handleActiveChange(): void {
    if (!isEditing) {
      setIsActive((current) => !current);
      return;
    }

    const nextIsActive = !isActive;
    const confirmed = window.confirm(
      nextIsActive
        ? "Reactivate this reference-data set?"
        : "Deactivate this reference-data set? Existing values are preserved.",
    );

    if (confirmed) {
      setIsActive(nextIsActive);
    }
  }

  async function handleSubmit(
    event: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setFieldErrors({});
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (referenceSet === undefined) {
        const created = await createReferenceDataSet({
          code,
          name,
          description,
          isActive,
        });

        router.push(`/administration/reference-data/${created.id}`);
        router.refresh();
        return;
      }

      const updated = await updateReferenceDataSet(referenceSet.id, {
        name,
        description,
        isActive,
      });
      setName(updated.name);
      setDescription(updated.description);
      setIsActive(updated.is_active);
      setSuccessMessage("Reference-data set changes saved.");
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof ReferenceDataManagementError) {
        setFieldErrors(error.fieldErrors);
        const hasFieldErrors =
          error.fieldErrors.code !== undefined ||
          error.fieldErrors.name !== undefined ||
          error.fieldErrors.description !== undefined ||
          error.fieldErrors.isActive !== undefined;
        setErrorMessage(hasFieldErrors ? null : error.message);
      } else {
        setErrorMessage("Unable to save the reference-data set.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="max-w-2xl space-y-6 rounded-xl border border-slate-200 bg-white p-6"
      onSubmit={handleSubmit}
    >
      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-slate-700"
          htmlFor="reference-set-code"
        >
          Code
        </label>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm text-slate-950 outline-none focus:border-slate-500 disabled:bg-slate-100 disabled:text-slate-500"
          disabled={isEditing}
          id="reference-set-code"
          maxLength={64}
          name="code"
          onChange={(event) => setCode(event.target.value)}
          pattern="[A-Za-z][A-Za-z0-9_]*"
          required
          type="text"
          value={code}
        />
        <p className="mt-1.5 text-xs leading-5 text-slate-500">
          Stable identifier. Codes are normalized to uppercase and cannot be
          changed after creation.
        </p>
        {fieldErrors.code?.map((message) => (
          <p className="mt-1.5 text-sm text-red-700" key={message}>
            {message}
          </p>
        ))}
      </div>

      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-slate-700"
          htmlFor="reference-set-name"
        >
          Name
        </label>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-500"
          id="reference-set-name"
          maxLength={150}
          name="name"
          onChange={(event) => setName(event.target.value)}
          required
          type="text"
          value={name}
        />
        {fieldErrors.name?.map((message) => (
          <p className="mt-1.5 text-sm text-red-700" key={message}>
            {message}
          </p>
        ))}
      </div>

      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-slate-700"
          htmlFor="reference-set-description"
        >
          Description
        </label>
        <textarea
          className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-500"
          id="reference-set-description"
          name="description"
          onChange={(event) => setDescription(event.target.value)}
          value={description}
        />
        {fieldErrors.description?.map((message) => (
          <p className="mt-1.5 text-sm text-red-700" key={message}>
            {message}
          </p>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">
              {isActive ? "Set is active" : "Set is inactive"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Inactivation preserves the set and its values for historical use.
            </p>
          </div>
          <button
            className="w-fit rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={handleActiveChange}
            type="button"
          >
            {isActive ? "Set inactive" : "Set active"}
          </button>
        </div>
        {fieldErrors.isActive?.map((message) => (
          <p className="mt-2 text-sm text-red-700" key={message}>
            {message}
          </p>
        ))}
      </div>

      {errorMessage !== null ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      {successMessage !== null ? (
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
          role="status"
        >
          {successMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? "Saving..."
            : isEditing
              ? "Save changes"
              : "Create reference-data set"}
        </button>
        {!isEditing ? (
          <Link
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            href="/administration/reference-data"
          >
            Cancel
          </Link>
        ) : null}
      </div>
    </form>
  );
}
