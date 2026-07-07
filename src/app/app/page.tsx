import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { LogoutForm } from "@/components/logout-form";
import { getUserInspectionCounts } from "@/server/inspections/list-user-inspections";

export const dynamic = "force-dynamic";

export default async function AppPage() {
  const user = await requireUser();
  const counts = await getUserInspectionCounts(user);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-4 py-6">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-sm text-[var(--primary)]">مساحة العمل</p>
        <h1 className="mt-2 text-2xl font-bold">أهلاً {user.fullName}</h1>
        <p className="mt-2 text-sm">الدور: {user.role === "QUALITY_ADMIN" ? "مسؤول الجودة" : "مفتش"}</p>
        <p className="mt-4 leading-7 text-neutral-700 dark:text-neutral-200">
          يمكنك إنشاء تفتيش جديد ومتابعة المسودات وتوثيق حالة البنود.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">المسودات</p>
          <p className="mt-2 text-2xl font-bold">{counts.drafts}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">المرجعة</p>
          <p className="mt-2 text-2xl font-bold">{counts.returned}</p>
        </div>
      </section>

      <section className="grid gap-3">
        <Link
          className="rounded-md bg-[var(--primary)] px-4 py-3 text-center font-semibold text-[var(--primary-foreground)]"
          href="/app/inspections/new"
        >
          بدء تفتيش جديد
        </Link>
        <Link
          className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-center font-semibold"
          href="/app/inspections"
        >
          قائمة الأعمال
        </Link>
      </section>
      <LogoutForm />
    </main>
  );
}
