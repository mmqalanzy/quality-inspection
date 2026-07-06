import { prisma } from "@/server/db";
import { type SessionUser } from "@/server/auth/session-core";
import { canReviewInspection } from "./inspection-access";

export type ReviewInspectionResult =
  | { ok: true; inspectionId: string; newStatus: string }
  | { ok: false; status: number; message: string };

export async function reviewInspection(
  user: SessionUser,
  inspectionId: string,
  decision: "approve" | "return",
  reviewNote?: string
): Promise<ReviewInspectionResult> {
  if (!canReviewInspection(user)) {
    return { ok: false, status: 403, message: "فقط مسؤول الجودة يمكنه المراجعة." };
  }

  if (decision === "return" && (!reviewNote || reviewNote.trim().length === 0)) {
    return { ok: false, status: 400, message: "ملاحظة الإرجاع مطلوبة." };
  }

  const inspection = await prisma.inspection.findUnique({
    where: { id: inspectionId },
    select: { id: true, status: true }
  });

  if (!inspection) {
    return { ok: false, status: 404, message: "التفتيش غير موجود." };
  }

  if (inspection.status !== "SUBMITTED") {
    return { ok: false, status: 422, message: "يمكن مراجعة التفتيش المرسل فقط." };
  }

  const action = decision === "approve" ? "INSPECTION_APPROVED" : "INSPECTION_RETURNED";
  const newStatus = decision === "approve" ? "APPROVED" : "RETURNED";

  await prisma.$transaction(async (tx) => {
    await tx.inspection.update({
      where: { id: inspectionId },
      data: {
        status: newStatus,
        approvedAt: decision === "approve" ? new Date() : undefined,
        reviewNote: reviewNote?.trim() || null
      }
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action,
        entityType: "Inspection",
        entityId: inspectionId,
        metadataJson: JSON.stringify({
          decision,
          reviewNote: reviewNote?.trim() || null,
          previousStatus: inspection.status
        })
      }
    });
  });

  return { ok: true, inspectionId, newStatus };
}
