import { calculateInspectionProgress } from "@/domain/inspections/progress";
import { prisma } from "@/server/db";
import { type SessionUser } from "@/server/auth/session-core";

export async function listUserInspections(user: SessionUser, status?: string) {
  const inspections = await prisma.inspection.findMany({
    where: {
      inspectorId: user.role === "INSPECTOR" ? user.id : undefined,
      status: status && status !== "ALL" ? status : undefined
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      workOrderNumber: true,
      status: true,
      updatedAt: true,
      template: { select: { name: true } },
      city: { select: { name: true } },
      contractor: { select: { name: true } },
      items: { select: { status: true, notes: true } }
    }
  });

  return inspections.map((inspection) => ({
    ...inspection,
    progress: calculateInspectionProgress(inspection.items)
  }));
}

export async function getUserInspectionCounts(user: SessionUser) {
  const where = {
    inspectorId: user.role === "INSPECTOR" ? user.id : undefined
  };
  const [drafts, returned] = await Promise.all([
    prisma.inspection.count({ where: { ...where, status: "DRAFT" } }),
    prisma.inspection.count({ where: { ...where, status: "RETURNED" } })
  ]);

  return { drafts, returned };
}
