"use client";

import Link from "next/link";
import { useState } from "react";
import { activateAccount } from "../api/activate-account";
import { AuthError } from "../api/auth-error";

interface AccountActivationFormProps {
  readonly uid: string;
  readonly token: string;
  readonly email: string;
}

export function AccountActivationForm({
  uid,
  token,
  email,
}: AccountActivationFormProps): React.ReactNode {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  async function handleSubmit(
    event: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setErrorMessage(null);

    if (password !== passwordConfirmation) {
      setErrorMessage("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await activateAccount(uid, token, {
        password,
        passwordConfirmation,
      });

      setIsComplete(true);
    } catch (error: unknown) {
      if (error instanceof AuthError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Unable to activate your account.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <div className="space-y-6">
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
          role="status"
        >
          <h2 className="font-semibold text-emerald-900">Account activated</h2>

          <p className="mt-1 text-sm text-emerald-800">
            Your password has been created successfully. You can now sign in.
          </p>
        </div>

        <Link
          href="/login"
          className="inline-flex w-full justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Continue to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <p className="text-sm text-slate-500">Account</p>

        <p className="font-medium text-slate-900">{email}</p>
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Password
        </label>

        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500"
        />

        <p className="mt-1.5 text-xs text-slate-500">
          Use at least 12 characters. Avoid common or easily guessed passwords.
        </p>
      </div>

      <div>
        <label
          htmlFor="passwordConfirmation"
          className="mt-1.5 block text-sm font-medium text-slate-700"
        >
          Confirm password
        </label>

        <input
          id="passwordConfirmation"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500"
        />
      </div>

      {errorMessage !== null ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Activating..." : "Set password and activate account"}
      </button>
    </form>
  );
}
