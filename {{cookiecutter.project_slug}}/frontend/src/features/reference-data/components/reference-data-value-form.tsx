"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createReferenceDataValue,
  ReferenceDataManagementError,
  updateReferenceDataValue,
} from "../api/reference-data-management";
import type { ReferenceDataValue } from "../types/reference-data";
import type { ReferenceDataFieldErrors } from "../types/reference-data-management";

interface ReferenceDataValueFormProps {
  readonly referenceSetId: string;
  readonly value?: ReferenceDataValue;
}

export function ReferenceDataValueForm({
  referenceSetId,
  value,
}: ReferenceDataValueFormProps): React.ReactNode {
  const router = useRouter();
  const [code, setCode] = useState(value?.code ?? "");
  const [name, setName] = useState(value?.name ?? "");
  const [description, setDescription] = useState(value?.description ?? "");
  const [sortOrder, setSortOrder] = useState(value?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(value?.is_active ?? true);
  const [fieldErrors, setFieldErrors] =
    useState<ReferenceDataFieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = value !== undefined;

  function handleActiveChange(): void {
    if (!isEditing) {
      setIsActive((current) => !current);
      return;
    }

    const nextIsActive = !isActive;
    const confirmed = window.confirm(
      nextIsActive
        ? "Reactivate this reference-data value?"
        : "Deactivate this reference-data value? It will remain available for historical records.",
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
      if (value === undefined) {
        const created = await createReferenceDataValue(referenceSetId, {
          code,
          name,
          description,
          sortOrder,
          isActive,
        });

        router.push(
          `/administration/reference-data/${referenceSetId}/values/${created.id}`,
        );
        router.refresh();
        return;
      }

      const updated = await updateReferenceDataValue(referenceSetId, value.id, {
        name,
        description,
        sortOrder,
        isActive,
      });
      setName(updated.name);
      setDescription(updated.description);
      setSortOrder(updated.sort_order);
      setIsActive(updated.is_active);
      setSuccessMessage("Reference-data value changes saved.");
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof ReferenceDataManagementError) {
        setFieldErrors(error.fieldErrors);
        const hasFieldErrors =
          error.fieldErrors.code !== undefined ||
          error.fieldErrors.name !== undefined ||
          error.fieldErrors.description !== undefined ||
          error.fieldErrors.sortOrder !== undefined ||
          error.fieldErrors.isActive !== undefined;
        setErrorMessage(hasFieldErrors ? null : error.message);
      } else {
        setErrorMessage("Unable to save the reference-data value.");
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
          htmlFor="reference-value-code"
        >
          Code
        </label>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm text-slate-950 outline-none focus:border-slate-500 disabled:bg-slate-100 disabled:text-slate-500"
          disabled={isEditing}
          id="reference-value-code"
          maxLength={64}
          name="code"
          onChange={(event) => setCode(event.target.value)}
          pattern="[A-Za-z][A-Za-z0-9_]*"
          required
          type="text"
          value={code}
        />
        <p className="mt-1.5 text-xs leading-5 text-slate-500">
          Stable within this set. Codes are normalized to uppercase and cannot
          be changed after creation.
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
          htmlFor="reference-value-name"
        >
          Name
        </label>
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-500"
          id="reference-value-name"
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
          htmlFor="reference-value-description"
        >
          Description
        </label>
        <textarea
          className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-500"
          id="reference-value-description"
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

      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-slate-700"
          htmlFor="reference-value-sort-order"
        >
          Sort order
        </label>
        <input
          className="w-full max-w-48 rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-500"
          id="reference-value-sort-order"
          min={0}
          name="sortOrder"
          onChange={(event) => setSortOrder(Number(event.target.value))}
          required
          type="number"
          value={sortOrder}
        />
        {fieldErrors.sortOrder?.map((message) => (
          <p className="mt-1.5 text-sm text-red-700" key={message}>
            {message}
          </p>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">
              {isActive ? "Value is active" : "Value is inactive"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Inactivation preserves this value for historical references.
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
              : "Create value"}
        </button>
        {!isEditing ? (
          <Link
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            href={`/administration/reference-data/${referenceSetId}`}
          >
            Cancel
          </Link>
        ) : null}
      </div>
    </form>
  );
}
