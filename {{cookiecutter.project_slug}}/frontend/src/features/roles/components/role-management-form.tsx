"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  createRole,
  RoleManagementError,
  updateRole,
} from "../api/role-management";
import { groupRolePermissions } from "../permission-groups";
import type { RoleDetail, RoleDetailPermission } from "../types/role-detail";
import type { RoleManagementFieldErrors } from "../types/role-management";

interface RoleManagementFormProps {
  readonly availablePermissions: readonly RoleDetailPermission[];
  readonly role?: RoleDetail;
}

export function RoleManagementForm({
  availablePermissions,
  role,
}: RoleManagementFormProps): React.ReactNode {
  const router = useRouter();
  const initialPermissionIds = useMemo(
    () => role?.permissions.map((permission) => permission.id) ?? [],
    [role],
  );
  const permissionGroups = useMemo(
    () => groupRolePermissions(availablePermissions),
    [availablePermissions],
  );
  const [name, setName] = useState(role?.name ?? "");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<
    Set<number>
  >(() => new Set(initialPermissionIds));
  const [fieldErrors, setFieldErrors] =
    useState<RoleManagementFieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = role !== undefined;

  function togglePermission(permissionId: number): void {
    setSelectedPermissionIds((current) => {
      const next = new Set(current);

      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }

      return next;
    });
  }

  function resetForm(): void {
    setName(role?.name ?? "");
    setSelectedPermissionIds(new Set(initialPermissionIds));
    setFieldErrors({});
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleSubmit(
    event: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setFieldErrors({});
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const input = {
      name,
      permissionIds: Array.from(selectedPermissionIds).sort(
        (left, right) => left - right,
      ),
    };

    try {
      if (role === undefined) {
        const createdRole = await createRole(input);

        router.push(`/administration/roles/${createdRole.id}`);
        router.refresh();
        return;
      }

      const updatedRole = await updateRole(role.id, input);
      setName(updatedRole.name);
      setSelectedPermissionIds(
        new Set(updatedRole.permissions.map((permission) => permission.id)),
      );
      setSuccessMessage("Role changes saved.");
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof RoleManagementError) {
        setFieldErrors(error.fieldErrors);

        const hasFieldErrors =
          error.fieldErrors.name !== undefined ||
          error.fieldErrors.permissionIds !== undefined;

        setErrorMessage(hasFieldErrors ? null : error.message);
      } else {
        setErrorMessage("Unable to save role.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-6"
      onSubmit={handleSubmit}
    >
      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-slate-700"
          htmlFor="role-name"
        >
          Role name
        </label>
        <input
          className="w-full max-w-2xl rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-500"
          id="role-name"
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

      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">
              Direct permissions
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Saving replaces this role&apos;s direct Django permissions with the
              exact selected set.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            {selectedPermissionIds.size} selected
          </p>
        </div>

        {permissionGroups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
            No permissions are available.
          </div>
        ) : (
          <div className="space-y-4">
            {permissionGroups.map((group) => (
              <fieldset
                className="rounded-lg border border-slate-200 p-4"
                key={group.key}
              >
                <legend className="px-1 text-sm font-semibold text-slate-950">
                  {group.appLabel} / {group.model}
                </legend>
                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  {group.permissions.map((permission) => (
                    <label
                      className="flex items-start gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
                      key={permission.id}
                    >
                      <input
                        checked={selectedPermissionIds.has(permission.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                        disabled={isSubmitting}
                        onChange={() => togglePermission(permission.id)}
                        type="checkbox"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-900">
                          {permission.name}
                        </span>
                        <span className="mt-0.5 block break-all font-mono text-xs text-slate-500">
                          {permission.permission}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        )}

        {fieldErrors.permissionIds?.map((message) => (
          <p className="text-sm text-red-700" key={message}>
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
              : "Create role"}
        </button>

        {isEditing ? (
          <button
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={resetForm}
            type="button"
          >
            Reset
          </button>
        ) : (
          <Link
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            href="/administration/roles"
          >
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
