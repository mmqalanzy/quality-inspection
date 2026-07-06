import { itemStatusArabic, executionStatusArabic } from "@/domain/inspections/statuses";
import { getItemSectionIcon, getItemSectionLabel, groupItemsBySection } from "@/domain/inspections/sections";
import { requireUser } from "@/server/auth/session";
import { getInspectionForUser } from "@/server/inspections/get-inspection";
import { canSubmitInspection } from "@/server/inspections/inspection-access";
import { SubmitForm } from "@/components/submit-form";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ inspectionId: string }>;
};

export default async function InspectionReviewPage({ params }: Props) {
  const user = await requireUser();
  const { inspectionId } = await params;
  const inspection = await getInspectionForUser(user, inspectionId);
  const submittable = canSubmitInspection(user, { inspectorId: inspection.inspectorId, status: inspection.status });
  const notStarted = inspection.items.filter((item) => item.status === "NOT_STARTED");
  const needsNotes = inspection.items.filter(
    (item) =>
      (item.status === "NON_COMPLIANT" || item.status === "NOT_APPLICABLE") &&
      !item.notes?.trim()
  );
  const incompleteItems = inspection.items.filter(
    (item) => item.status !== "COMPLIANT" && item.status !== "NON_COMPLIANT" && item.status !== "NOT_APPLICABLE"
  );
  const validationWarnings = incompleteItems.map(
    (item) => `البند "${item.templateItem.title}" غير مكتمل`
  );
  const sectionGroups = groupItemsBySection(inspection.items);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-4 py-6">
      <header className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-sm text-[var(--primary)]">مراجعة أولية</p>
        <h1 className="mt-2 text-2xl font-bold">أمر {inspection.workOrderNumber}</h1>
        <p className="mt-2">{inspection.city.name} - {inspection.contractor.name}</p>
        <p className="mt-1 text-sm">{executionStatusArabic[inspection.executionStatus as keyof typeof executionStatusArabic] ?? inspection.executionStatus}</p>
      </header>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="font-bold">ملخص التقدم</h2>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <Summary label="الإجمالي" value={inspection.progress.total} />
          <Summary label="الموثق" value={inspection.progress.documented} />
          <Summary label="مطابق" value={inspection.progress.compliant} />
          <Summary label="غير مطابق" value={inspection.progress.nonCompliant} />
          <Summary label="غير منطبق" value={inspection.progress.notApplicable} />
          <Summary label="إعادة تصوير" value={inspection.progress.needsRecapture} />
          <Summary label="لم يبدأ" value={inspection.progress.notStarted} />
          <Summary label="النسبة" value={`${inspection.progress.percent}%`} />
        </dl>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="font-bold">البنود التي لم تبدأ</h2>
        <List items={notStarted.map((item) => item.templateItem.title)} empty="لا توجد بنود لم تبدأ." />
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="font-bold">بنود تحتاج ملاحظات</h2>
        <List items={needsNotes.map((item) => item.templateItem.title)} empty="لا توجد بنود تحتاج ملاحظات." />
      </section>

      {submittable ? (
        <SubmitForm
          canSubmit={submittable}
          inspectionId={inspection.id}
          validationWarnings={validationWarnings}
          inspectionData={{
            workOrderNumber: inspection.workOrderNumber,
            inspectorName: inspection.inspector.fullName,
            contractorName: inspection.contractor.name,
            cityName: inspection.city.name,
            location: inspection.location,
            workDescription: inspection.workDescription,
            executionStatus: inspection.executionStatus,
            generalNotes: inspection.generalNotes,
            submittedAt: new Date().toLocaleDateString("ar-SA"),
            items: inspection.items.map((item) => ({
              order: item.templateItem.order,
              title: item.templateItem.title,
              status: item.status,
              notes: item.notes
            })),
            photos: inspection.items.flatMap((item) =>
              item.photos.map((photo) => ({
                id: photo.id,
                itemTitle: item.templateItem.title,
                src: `/api/evidence-photos/${photo.id}`
              }))
            )
          }}
        />
      ) : (
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            التفتيش ليس في حالة تسمح بالإرسال.
          </p>
        </section>
      )}

      <section className="grid gap-3">
        {sectionGroups.map((group) => (
          <div key={group.section} className="grid gap-2">
            <div className="flex items-center gap-2 px-1">
              <span className="text-base">{getItemSectionIcon(group.section)}</span>
              <h3 className="text-sm font-bold">{getItemSectionLabel(group.section)}</h3>
            </div>
            {group.items.map((item, index) => (
              <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3" key={item.id}>
                <div className="flex justify-between gap-2">
                  <span className="text-sm">{index + 1}. {item.templateItem.title}</span>
                  <span className="shrink-0 text-xs">{itemStatusArabic[item.status as keyof typeof itemStatusArabic] ?? item.status}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-[var(--surface-muted)] p-3">
      <dt>{label}</dt>
      <dd className="mt-1 text-lg font-bold">{value}</dd>
    </div>
  );
}

function List({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) {
    return <p className="mt-3 text-sm">{empty}</p>;
  }

  return (
    <ul className="mt-3 list-inside list-disc text-sm leading-7">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
