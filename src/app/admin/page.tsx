import Link from "next/link";
import { requireRole } from "@/server/auth/session";
import { LogoutForm } from "@/components/logout-form";
import { listSubmittedInspections, listApprovedInspections } from "@/server/inspections/list-submitted-inspections";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireRole("QUALITY_ADMIN");
  const submitted = await listSubmittedInspections(user);
  const approved = await listApprovedInspections(user);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--primary)]">لوحة مسؤول الجودة</p>
          <h1 className="text-2xl font-bold">مراجعة التفتيشات</h1>
        </div>
        <p className="text-xs text-neutral-500">{user.fullName}</p>
      </header>

      <section className="grid gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <span>تفتيشات بانتظار المراجعة</span>
          <span className="rounded-full bg-[var(--primary)] px-2 py-0.5 text-xs font-bold text-[var(--primary-foreground)]">
            {submitted.length}
          </span>
        </h2>

        {submitted.length === 0 ? (
          <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-neutral-500">
            لا توجد تفتيشات بانتظار المراجعة.
          </p>
        ) : (
          submitted.map((inspection) => (
            <article
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
              key={inspection.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">أمر {inspection.workOrderNumber}</h3>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    {inspection.inspector.fullName}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {inspection.city.name} - {inspection.contractor.name}
                  </p>
                  {inspection.submittedAt ? (
                    <p className="mt-1 text-xs text-neutral-400">
                      أُرسل: {inspection.submittedAt.toLocaleString("ar-SA")}
                    </p>
                  ) : null}
                </div>
              </div>
              <Link
                className="mt-3 block w-full rounded-md bg-[var(--primary)] px-4 py-3 text-center text-sm font-bold text-[var(--primary-foreground)]"
                href={`/app/inspections/${inspection.id}`}
              >
                عرض التفاصيل
              </Link>
            </article>
          ))
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <span>تفتيشات معتمدة</span>
          <span className="rounded-full bg-[var(--status-compliant)] px-2 py-0.5 text-xs font-bold text-white">
            {approved.length}
          </span>
        </h2>

        {approved.length === 0 ? (
          <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-neutral-500">
            لا توجد تفتيشات معتمدة.
          </p>
        ) : (
          approved.map((inspection) => (
            <article
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
              key={inspection.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">أمر {inspection.workOrderNumber}</h3>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    {inspection.inspector.fullName}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {inspection.city.name} - {inspection.contractor.name}
                  </p>
                  {inspection.approvedAt ? (
                    <p className="mt-1 text-xs text-neutral-400">
                      عُتمد: {inspection.approvedAt.toLocaleString("ar-SA")}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  className="rounded-md border border-[var(--border)] px-4 py-3 text-center text-sm font-semibold"
                  href={`/app/inspections/${inspection.id}`}
                >
                  عرض التفاصيل
                </Link>
                <a
                  className="rounded-md bg-[var(--status-compliant)] px-4 py-3 text-center text-sm font-bold text-white"
                  href={`/api/inspections/${inspection.id}/report`}
                  target="_blank"
                  rel="noreferrer"
                >
                  تحميل PDF
                </a>
              </div>
            </article>
          ))
        )}
      </section>

      <LogoutForm />
    </main>
  );
}
