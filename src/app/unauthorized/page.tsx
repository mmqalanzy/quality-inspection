import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-6">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <h1 className="text-2xl font-bold">لا توجد صلاحية</h1>
        <p className="mt-3 leading-7 text-neutral-700 dark:text-neutral-200">
          حسابك لا يملك صلاحية فتح هذه الصفحة.
        </p>
        <Link
          className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-[var(--primary)] px-4 py-3 font-semibold text-[var(--primary-foreground)]"
          href="/app"
        >
          العودة لمساحة العمل
        </Link>
      </section>
    </main>
  );
}
