import type { AuthUser } from "@/features/auth/types/auth-user";

interface WelcomePanelProps {
  readonly user: AuthUser;
}

function getGreetingName(user: AuthUser): string {
  const firstName = user.first_name.trim();

  return firstName.length > 0 ? firstName : user.email;
}

export function WelcomePanel({
  user,
}: WelcomePanelProps): React.ReactNode {
  const greetingName = getGreetingName(user);

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl bg-slate-950 px-6 py-8 text-white shadow-sm sm:px-8">
      <div className="min-w-0 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
          {{ cookiecutter.project_name }}
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="block">Welcome back,</span>

          <span className="mt-1 block break-all sm:wrap-break-word">
            {greetingName}.
          </span>
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
          You&apos;re signed in to {{ cookiecutter.project_name }}.
        </p>
      </div>
    </section>
  );
}
