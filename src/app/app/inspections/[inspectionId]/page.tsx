import Link from "next/link";
import { itemStatusArabic, executionStatusArabic, inspectionStatusArabic } from "@/domain/inspections/statuses";
import { getItemSectionIcon, getItemSectionLabel, groupItemsBySection } from "@/domain/inspections/sections";
import { requireUser } from "@/server/auth/session";
import { getInspectionForUser } from "@/server/inspections/get-inspection";
import { canEditInspection, canSubmitInspection, canReviewInspection } from "@/server/inspections/inspection-access";
import { buildStatusOptions, getStatusStyle } from "../status-options";
import { ItemPhotoPicker } from "./item-photos";
import { InspectionItemEditor } from "./item-editor";
import { SubmitForm } from "@/components/submit-form";
import { ReviewActions } from "@/components/review-actions";
import { RecallForm } from "@/components/recall-form";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ inspectionId: string }>;
};

export default async function InspectionPage({ params }: Props) {
  const user = await requireUser();
  const { inspectionId } = await params;
  const inspection = await getInspectionForUser(user, inspectionId);
  const editable = canEditInspection(user, { inspectorId: inspection.inspectorId, status: inspection.status });
  const submittable = canSubmitInspection(user, { inspectorId: inspection.inspectorId, status: inspection.status });
  const reviewable = canReviewInspection(user);
  const isReturned = inspection.status === "RETURNED";
  const isApproved = inspection.status === "APPROVED";
  const isSubmitted = inspection.status === "SUBMITTED";

  const incompleteItems = inspection.items.filter(
    (item) => item.status !== "COMPLIANT" && item.status !== "NON_COMPLIANT" && item.status !== "NOT_APPLICABLE"
  );
  const validationWarnings = incompleteItems.map(
    (item) => `البند "${item.templateItem.title}" غير مكتمل`
  );

  const statusOptions = buildStatusOptions();
  const sectionGroups = groupItemsBySection(inspection.items);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-3 px-4 py-4 pb-24">
      <header className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-xs text-[var(--primary)]">{inspection.template.name}</p>
        <h1 className="mt-1 text-xl font-bold">أمر {inspection.workOrderNumber}</h1>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
          {inspection.city.name} - {inspection.contractor.name} - {executionStatusArabic[inspection.executionStatus as keyof typeof executionStatusArabic] ?? inspection.executionStatus}
        </p>
        <p className="mt-2 text-sm leading-6">{inspection.workDescription}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-md bg-[var(--surface-muted)] px-2 py-1 text-xs font-bold">
            {inspectionStatusArabic[inspection.status as keyof typeof inspectionStatusArabic] ?? inspection.status}
          </span>
          {isApproved && inspection.reportFileId ? (
            <a
              className="rounded-md bg-[var(--primary)] px-3 py-1 text-xs font-bold text-[var(--primary-foreground)]"
              href={`/api/inspections/${inspection.id}/report`}
              target="_blank"
              rel="noreferrer"
            >
              تحميل التقرير PDF
            </a>
          ) : null}
        </div>
      </header>

      {isReturned && inspection.reviewNote ? (
        <section className="rounded-lg border border-[var(--status-idle)] bg-[var(--status-idle-bg)] p-4">
          <p className="text-sm font-bold text-[var(--status-idle)]">ملاحظة المراجعة:</p>
          <p className="mt-1 text-sm leading-7">{inspection.reviewNote}</p>
          <p className="mt-2 text-xs font-semibold text-[var(--status-idle)]">
            يجب تعديل البنود وإعادة الإرسال
          </p>
        </section>
      ) : null}

      {sectionGroups.map((group) => {
        const sectionItems = group.items;
        const completedInSection = sectionItems.filter(
          (item) => item.status === "COMPLIANT" || item.status === "NON_COMPLIANT" || item.status === "NOT_APPLICABLE"
        ).length;

        return (
          <section key={group.section} className="grid gap-2">
            <div className="flex items-center gap-2 px-1">
              <span className="text-lg">{getItemSectionIcon(group.section)}</span>
              <h2 className="text-sm font-bold">{getItemSectionLabel(group.section)}</h2>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {completedInSection}/{sectionItems.length}
              </span>
              <div className="ml-auto h-1 flex-1 rounded-full bg-[var(--surface-muted)]">
                <div
                  className="h-1 rounded-full bg-[var(--primary)] transition-all"
                  style={{ width: `${sectionItems.length > 0 ? (completedInSection / sectionItems.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="grid gap-3">
              {sectionItems.map((item, index) => {
                const style = getStatusStyle(item.status);
                return (
                  <article
                    className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]"
                    key={item.id}
                    style={{ borderRight: `4px solid var(${style.colorVar})` }}
                  >
                    <div
                      className="p-4"
                      style={{ backgroundColor: `var(${style.bgVar})` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {index + 1} من {sectionItems.length}
                          </p>
                          <h3 className="mt-1 font-bold leading-6">{item.templateItem.title}</h3>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-white"
                          style={{ backgroundColor: `var(${style.colorVar})` }}
                        >
                          {style.icon} {itemStatusArabic[item.status as keyof typeof itemStatusArabic] ?? item.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <ItemPhotoPicker
                        itemId={item.id}
                        initialPhotos={item.photos}
                        canEdit={editable}
                        minimumPhotos={item.templateItem.minimumPhotos}
                      />
                      {editable ? (
                        <InspectionItemEditor
                          itemId={item.id}
                          initialNotes={item.notes ?? ""}
                          initialStatus={item.status}
                          initialVersion={item.version}
                          statuses={statusOptions}
                        />
                      ) : (
                        item.notes?.trim() ? (
                          <div className="mt-3 rounded-md bg-[var(--surface-muted)] p-3 text-sm">
                            {item.notes}
                          </div>
                        ) : null
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

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
      ) : null}

      {reviewable && isSubmitted ? (
        <ReviewActions inspectionId={inspection.id} />
      ) : null}

      {isSubmitted && user.role === "INSPECTOR" && user.id === inspection.inspectorId ? (
        <RecallForm inspectionId={inspection.id} />
      ) : null}

      <div className="sticky bottom-0 -mx-4 mt-2 border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-semibold">
              <span>التقدم</span>
              <span>{inspection.progress.documented}/{inspection.progress.total}</span>
            </div>
            <div className="mt-1 h-2.5 rounded-full bg-[var(--surface-muted)]">
              <div
                className="h-2.5 rounded-full bg-[var(--primary)] transition-all"
                style={{ width: `${inspection.progress.percent}%` }}
              />
            </div>
          </div>
          <Link
            className="shrink-0 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-[var(--primary-foreground)]"
            href={`/app/inspections/${inspection.id}/review`}
          >
            مراجعة
          </Link>
        </div>
      </div>
    </main>
  );
}
