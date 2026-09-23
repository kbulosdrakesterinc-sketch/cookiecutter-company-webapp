"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  provisionUser,
  UserProvisioningError,
} from "../api/provision-user";
import type { UserProvisioningFieldErrors } from "../types/user-provisioning";

export function ProvisionUserForm(): React.ReactNode {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fieldErrors, setFieldErrors] =
    useState<UserProvisioningFieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    event: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setFieldErrors({});
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const user = await provisionUser({
        email,
        firstName,
        lastName,
      });

      router.push(
        `/administration/users?search=${encodeURIComponent(user.email)}`,
      );
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof UserProvisioningError) {
        setFieldErrors(error.fieldErrors);

        const hasFieldErrors =
          error.fieldErrors.email !== undefined ||
          error.fieldErrors.firstName !== undefined ||
          error.fieldErrors.lastName !== undefined;

        setErrorMessage(hasFieldErrors ? null : error.message);
      } else {
        setErrorMessage("Unable to provision user.");
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

      <div className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        The account will be created without a usable password and will remain
        active while waiting for the existing account-activation flow.
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
          {isSubmitting ? "Provisioning..." : "Provision user"}
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
