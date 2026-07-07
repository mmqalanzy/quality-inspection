import { prisma } from "@/server/db";
import { type SessionUser } from "@/server/auth/session-core";
import { canReadInspection } from "./inspection-access";

export type RecallInspectionResult =
  | { ok: true; inspectionId: string }
  | { ok: false; status: number; message: string };

export async function recallInspection(
  user: SessionUser,
  inspectionId: string
): Promise<RecallInspectionResult> {
  const inspection = await prisma.inspection.findUnique({
    where: { id: inspectionId },
    select: {
      id: true,
      inspectorId: true,
      status: true
    }
  });

  if (!inspection) {
    return { ok: false, status: 404, message: "التفتيش غير موجود." };
  }

  if (!canReadInspection(user, inspection.inspectorId)) {
    return { ok: false, status: 403, message: "ليست لديك صلاحية الوصول لهذا التفتيش." };
  }

  if (user.role !== "INSPECTOR" || user.id !== inspection.inspectorId) {
    return { ok: false, status: 403, message: "فقط المفتش الذي أنشأ التفتيش يمكنه إرجاعه للتعديل." };
  }

  if (inspection.status !== "SUBMITTED") {
    return { ok: false, status: 422, message: "لا يمكن إرجاع التفتيش للتعديل إلا إذا كان مرسلًا للمراجعة." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.inspection.update({
      where: { id: inspectionId },
      data: { status: "RETURNED" }
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "INSPECTION_RECALLED",
        entityType: "Inspection",
        entityId: inspectionId,
        metadataJson: JSON.stringify({ previousStatus: inspection.status })
      }
    });
  });

  return { ok: true, inspectionId };
}
