import { InputFile } from "grammy";
import { isDocumentedItem } from "@/domain/inspections/progress";
import { prisma } from "@/server/db";
import { type SessionUser } from "@/server/auth/session-core";
import { getBot } from "@/bot";
import { getServerEnv } from "@/server/env";
import { canSubmitInspection } from "./inspection-access";

export type SubmitInspectionResult =
  | { ok: true; inspectionId: string }
  | { ok: false; status: number; message: string; details?: string[] };

export async function submitInspection(
  user: SessionUser,
  inspectionId: string,
  pdfBuffer: Buffer
): Promise<SubmitInspectionResult> {
  const inspection = await prisma.inspection.findUnique({
    where: { id: inspectionId },
    select: {
      id: true,
      inspectorId: true,
      status: true,
      workOrderNumber: true,
      inspector: { select: { fullName: true } }
    }
  });

  if (!inspection) {
    return { ok: false, status: 404, message: "التفتيش غير موجود." };
  }

  if (!canSubmitInspection(user, inspection)) {
    return { ok: false, status: 403, message: "ليست لديك صلاحية إرسال هذا التفتيش." };
  }

  const items = await prisma.inspectionItem.findMany({
    where: { inspectionId },
    select: {
      status: true,
      notes: true,
      templateItem: { select: { title: true, isRequired: true } }
    }
  });

  const details: string[] = [];
  for (const item of items) {
    if (!item.templateItem.isRequired) continue;
    if (!isDocumentedItem(item)) {
      details.push(`البند "${item.templateItem.title}" لم يتم توثيقه.`);
    }
  }

  if (details.length > 0) {
    return { ok: false, status: 422, message: "لا يمكن إرسال التفتيش. برجاء استكمال المتطلبات التالية:", details };
  }

  const now = new Date();

  let reportFileId: string | null = null;
  let reportMessageId: number | null = null;

  try {
    const env = getServerEnv();
    const bot = getBot();
    const caption = [
      "تقرير توثيق الجودة - معتمد",
      `أمر العمل: ${inspection.workOrderNumber}`,
      `المفتش: ${inspection.inspector.fullName}`,
      "الاستشاري: الحامد"
    ].join("\n");

    const sentMessage = await bot.api.sendDocument(
      env.TELEGRAM_STORAGE_CHAT_ID,
      new InputFile(pdfBuffer, `تقرير_${inspection.workOrderNumber}.pdf`),
      { caption }
    );

    if (sentMessage.document) {
      reportFileId = sentMessage.document.file_id;
      reportMessageId = sentMessage.message_id;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("PDF send failed:", error);
    return {
      ok: false,
      status: 500,
      message: `تعذر إرسال التقرير: ${errorMessage}`
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.inspection.update({
      where: { id: inspectionId },
      data: {
        status: "SUBMITTED",
        submittedAt: now,
        reportFileId: reportFileId,
        reportMessageId: reportMessageId
      }
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "INSPECTION_SUBMITTED",
        entityType: "Inspection",
        entityId: inspectionId,
        metadataJson: JSON.stringify({ previousStatus: inspection.status })
      }
    });
  });

  return { ok: true, inspectionId };
}
