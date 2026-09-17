"use client";

interface DashboardErrorProps {
  readonly error: Error & {
    readonly digest?: string;
  };
  readonly reset: () => void;
}

export default function DashboardError({
  error,
  reset,
}: DashboardErrorProps): React.ReactNode {
  return (
    <section
      aria-labelledby="dashboard-error-heading"
      className="rounded-xl border border-red-200 bg-red-50 p-6"
      role="alert"
    >
      <h1
        className="text-lg font-semibold text-red-950"
        id="dashboard-error-heading"
      >
        Dashboard unavailable
      </h1>

      <p className="mt-2 text-sm leading-6 text-red-800">
        The dashboard could not be loaded. Your account remains signed in.
        Please try again.
      </p>

      {process.env.NODE_ENV === "development" ? (
        <p className="mt-2 wrap-break-word font-mono text-xs text-red-700">
          {error.message}
        </p>
      ) : null}

      <button
        className="mt-4 rounded-lg bg-red-900 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </section>
  );
}
