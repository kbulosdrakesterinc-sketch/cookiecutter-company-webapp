import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage(): React.ReactNode {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {{ cookiecutter.project_name }}
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Welcome back
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sign in to continue.
          </p>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}
