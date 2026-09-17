import Link from "next/link";

import { AuthError } from "@/features/auth/api/auth-error";
import { getAccountActivationStatus } from "@/features/auth/api/get-account-activation-status";
import { AccountActivationForm } from "@/features/auth/components/AccountActivationForm";

interface AccountActivationPageProps {
  readonly params: Promise<{
    readonly uid: string;
    readonly token: string;
  }>;
}

export default async function AccountActivationPage({
  params,
}: AccountActivationPageProps): Promise<React.ReactNode> {
  const { uid, token } = await params;

  let activationEmail: string | null = null;
  let errorMessage: string | null = null;

  try {
    const activation = await getAccountActivationStatus(uid, token);

    activationEmail = activation.email;
  } catch (error: unknown) {
    errorMessage =
      error instanceof AuthError
        ? error.message
        : "This activation link cannot be used.";
  }

  if (errorMessage !== null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold text-slate-950">
            Activation link unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {errorMessage}
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex text-sm font-semibold text-slate-900 underline"
          >
            Return to sign in
          </Link>
        </section>
      </main>
    );
  }

  if (activationEmail === null) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {{ cookiecutter.project_name }}
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            Activate your account
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Create your password to finish setting up your account.
          </p>
        </div>

        <AccountActivationForm
          uid={uid}
          token={token}
          email={activationEmail}
        />
      </section>
    </main>
  );
}
