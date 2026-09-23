"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateUser, UserManagementError } from "../api/update-user";
import type { DirectoryUser } from "../types/user-directory";
import type { UserManagementFieldErrors } from "../types/user-management";
import { UserStatusBadge } from "./user-status-badge";

interface ManageUserFormProps {
  readonly user: DirectoryUser;
}

export function ManageUserForm({ user }: ManageUserFormProps): React.ReactNode {
  const router = useRouter();
  const [email, setEmail] = useState(user.email);
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [isActive, setIsActive] = useState(user.is_active);
  const [fieldErrors, setFieldErrors] =
    useState<UserManagementFieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleAccountStateChange(): void {
    const nextIsActive = !isActive;
    const confirmed = window.confirm(
      nextIsActive
        ? "Reactivate this account? The existing password state will be preserved."
        : "Deactivate this account? The user will no longer be able to authenticate.",
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
    setIsSubmitting(true);

    try {
      const updatedUser = await updateUser(user.id, {
        email,
        firstName,
        lastName,
        isActive,
      });

      router.push(
        `/administration/users?search=${encodeURIComponent(updatedUser.email)}`,
      );
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof UserManagementError) {
        setFieldErrors(error.fieldErrors);

        const hasFieldErrors =
          error.fieldErrors.email !== undefined ||
          error.fieldErrors.firstName !== undefined ||
          error.fieldErrors.lastName !== undefined ||
          error.fieldErrors.isActive !== undefined;

        setErrorMessage(hasFieldErrors ? null : error.message);
      } else {
        setErrorMessage("Unable to update user.");
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-4">
        <div>
          <p className="text-sm font-medium text-slate-700">
            Current account status
          </p>
          <div className="mt-2">
            <UserStatusBadge state={user.account_state} />
          </div>
        </div>
        <p className="max-w-sm text-sm leading-6 text-slate-600">
          Status changes are staged here and only take effect when you save the
          form.
        </p>
      </div>

      <div>
        <label
          className="mb-1.5 block text-sm font-medium text-slate-700"
          htmlFor="email"
        >
          Email
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-500"
          id="email"
          maxLength={254}
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        {fieldErrors.email?.map((message) => (
          <p className="mt-1.5 text-sm text-red-700" key={message}>
            {message}
          </p>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700"
            htmlFor="firstName"
          >
            First name
          </label>
          <input
            autoComplete="given-name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-500"
            id="firstName"
            maxLength={150}
            name="firstName"
            onChange={(event) => setFirstName(event.target.value)}
            type="text"
            value={firstName}
          />
          {fieldErrors.firstName?.map((message) => (
            <p className="mt-1.5 text-sm text-red-700" key={message}>
              {message}
            </p>
          ))}
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-slate-700"
            htmlFor="lastName"
          >
            Last name
          </label>
          <input
            autoComplete="family-name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 outline-none focus:border-slate-500"
            id="lastName"
            maxLength={150}
            name="lastName"
            onChange={(event) => setLastName(event.target.value)}
            type="text"
            value={lastName}
          />
          {fieldErrors.lastName?.map((message) => (
            <p className="mt-1.5 text-sm text-red-700" key={message}>
              {message}
            </p>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">
              {isActive ? "Account is active" : "Account is inactive"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {isActive
                ? "Deactivation blocks authentication without deleting the account or changing its password."
                : "Reactivation preserves the existing password state. An account without a usable password returns to Pending activation."}
            </p>
          </div>
          <button
            className="w-fit rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={handleAccountStateChange}
            type="button"
          >
            {isActive ? "Deactivate account" : "Reactivate account"}
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

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Saving..." : "Save changes"}
        </button>

        <Link
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          href="/administration/users"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
