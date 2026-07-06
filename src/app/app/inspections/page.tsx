import { inspectionStatusArabic } from "@/domain/inspections/statuses";
import { requireUser } from "@/server/auth/session";
import { listUserInspections } from "@/server/inspections/list-user-inspections";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function InspectionsPage({ searchParams }: Props) {
  const user = await requireUser();
  const { status } = await searchParams;
  const inspections = await listUserInspections(user, status);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--primary)]">قائمة الأعمال</p>
          <h1 className="text-2xl font-bold">تفتيشاتي</h1>
        </div>
        <a className="rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-[var(--primary-foreground)]" href="/app/inspections/new">
          جديد
        </a>
      </header>

      <form className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
        <label className="text-sm font-semibold" htmlFor="status">تصفية الحالة</label>
        <select className="mt-2 w-full rounded-md border border-[var(--border)] bg-transparent p-3" id="status" name="status" defaultValue={status ?? "ALL"}>
          <option value="ALL">الكل</option>
          <option value="DRAFT">مسودة</option>
          <option value="RETURNED">مرجع</option>
        </select>
        <button className="mt-3 w-full rounded-md border border-[var(--border)] p-2" type="submit">
          تطبيق
        </button>
      </form>

      <section className="grid gap-3">
        {inspections.length === 0 ? (
          <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            لا توجد تفتيشات حتى الآن.
          </p>
        ) : null}

        {inspections.map((inspection) => (
          <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4" key={inspection.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">أمر {inspection.workOrderNumber}</h2>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                  {inspection.template.name} - {inspection.city.name} - {inspection.contractor.name}
                </p>
              </div>
              <span className="rounded-md bg-[var(--surface-muted)] px-2 py-1 text-xs">
                {inspectionStatusArabic[inspection.status as keyof typeof inspectionStatusArabic] ?? inspection.status}
              </span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span>الإنجاز</span>
                <span>{inspection.progress.percent}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[var(--surface-muted)]">
                <div className="h-2 rounded-full bg-[var(--primary)]" style={{ width: `${inspection.progress.percent}%` }} />
              </div>
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              آخر تعديل: {inspection.updatedAt.toLocaleString("ar-SA")}
            </p>
            <a className="mt-4 inline-flex w-full justify-center rounded-md border border-[var(--border)] px-4 py-3 font-semibold" href={`/app/inspections/${inspection.id}`}>
              متابعة
            </a>
          </article>
        ))}
      </section>
    </main>
  );
}
