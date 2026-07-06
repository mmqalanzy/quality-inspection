import { executionStatusArabic, executionStatuses } from "@/domain/inspections/statuses";
import { requireUser } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { NewInspectionForm } from "./new-inspection-form";

export const dynamic = "force-dynamic";

export default async function NewInspectionPage() {
  await requireUser();
  const [cities, contractors, templates] = await Promise.all([
    prisma.city.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.contractor.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.inspectionTemplate.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-4 py-6">
      <header>
        <p className="text-sm text-[var(--primary)]">تفتيش جديد</p>
        <h1 className="text-2xl font-bold">بيانات أمر العمل</h1>
      </header>
      <NewInspectionForm
        cities={cities.map(({ id, name }) => ({ id, name }))}
        contractors={contractors.map(({ id, name }) => ({ id, name }))}
        executionStatuses={executionStatuses.map((value) => ({
          value,
          label: executionStatusArabic[value]
        }))}
        templates={templates.map(({ id, name }) => ({ id, name }))}
      />
    </main>
  );
}
