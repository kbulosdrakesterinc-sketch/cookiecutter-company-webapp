import Link from "next/link";

export default function RoleDetailNotFound(): React.ReactNode {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8">
      <h1 className="text-xl font-semibold text-slate-950">Role not found</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        The requested role does not exist or is not available to you.
      </p>
      <Link
        className="mt-5 inline-flex text-sm font-semibold text-slate-700 hover:text-slate-950"
        href="/administration/roles"
      >
        ← Back to roles
      </Link>
    </section>
  );
}
