import Link from "next/link";
import { requireUser } from "@/server/auth/session";
import { getInspectionItemForUser } from "@/server/inspections/get-inspection";
import { buildStatusOptions } from "../../../status-options";
import { InspectionItemEditor } from "../../item-editor";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ inspectionId: string; itemId: string }>;
};

export default async function InspectionItemPage({ params }: Props) {
  const user = await requireUser();
  const { inspectionId, itemId } = await params;
  const { inspection, item, previousItem, nextItem } = await getInspectionItemForUser(
    user,
    inspectionId,
    itemId
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-4 py-6">
      <header className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-sm text-[var(--primary)]">أمر {inspection.workOrderNumber}</p>
        <h1 className="mt-2 text-2xl font-bold">البند {item.templateItem.order} من {inspection.items.length}</h1>
        <p className="mt-2 font-semibold">{item.templateItem.title}</p>
        {item.templateItem.description ? <p className="mt-2 text-sm">{item.templateItem.description}</p> : null}
      </header>

      <InspectionItemEditor
        initialNotes={item.notes ?? ""}
        initialStatus={item.status}
        initialVersion={item.version}
        itemId={item.id}
        statuses={buildStatusOptions()}
      />

      <nav className="grid grid-cols-2 gap-3">
        {previousItem ? (
          <Link className="rounded-md border border-[var(--border)] px-4 py-3 text-center font-semibold" href={`/app/inspections/${inspection.id}/items/${previousItem.id}`}>
            السابق
          </Link>
        ) : (
          <span />
        )}
        {nextItem ? (
          <Link className="rounded-md border border-[var(--border)] px-4 py-3 text-center font-semibold" href={`/app/inspections/${inspection.id}/items/${nextItem.id}`}>
            التالي
          </Link>
        ) : (
          <Link className="rounded-md border border-[var(--border)] px-4 py-3 text-center font-semibold" href={`/app/inspections/${inspection.id}`}>
            القائمة
          </Link>
        )}
      </nav>
    </main>
  );
}
