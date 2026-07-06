import { calculateInspectionProgress } from "@/domain/inspections/progress";
import {
  updateInspectionItemSchema,
  type UpdateInspectionItemInput
} from "@/domain/inspections/validation";
import { prisma } from "@/server/db";
import { type SessionUser } from "@/server/auth/session-core";
import { canEditInspection } from "./inspection-access";

export type UpdateInspectionItemResult =
  | {
      ok: true;
      item: {
        id: string;
        status: string;
        notes: string | null;
        version: number;
        updatedAt: string;
      };
      progress: ReturnType<typeof calculateInspectionProgress>;
    }
  | { ok: false; status: number; message: string; latest?: unknown };

export async function updateInspectionItem(
  user: SessionUser,
  itemId: string,
  input: unknown
): Promise<UpdateInspectionItemResult> {
  const parsed = updateInspectionItemSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      message:
        parsed.error.issues[0]?.message ?? "تعذر حفظ التعديل. تحقق من البيانات وأعد المحاولة."
    };
  }

  return updateInspectionItemWithData(user, itemId, parsed.data);
}

async function updateInspectionItemWithData(
  user: SessionUser,
  itemId: string,
  input: UpdateInspectionItemInput
): Promise<UpdateInspectionItemResult> {
  const existing = await prisma.inspectionItem.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      status: true,
      notes: true,
      version: true,
      inspection: {
        select: {
          id: true,
          inspectorId: true,
          status: true
        }
      },
      templateItemId: true
    }
  });

  if (!existing || !canEditInspection(user, existing.inspection)) {
    return {
      ok: false,
      status: existing ? 403 : 404,
      message: "ليست لديك صلاحية لتعديل هذا البند."
    };
  }

  if (existing.version !== input.version) {
    return {
      ok: false,
      status: 409,
      message: "حدث تعارض في الحفظ. تم تحميل أحدث نسخة.",
      latest: {
        status: existing.status,
        notes: existing.notes,
        version: existing.version
      }
    };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const item = await tx.inspectionItem.update({
      where: { id: itemId },
      data: {
        status: input.status,
        notes: input.notes?.trim() || null,
        version: { increment: 1 }
      },
      select: {
        id: true,
        status: true,
        notes: true,
        version: true,
        updatedAt: true,
        inspectionId: true
      }
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "INSPECTION_ITEM_UPDATED",
        entityType: "InspectionItem",
        entityId: item.id,
        metadataJson: JSON.stringify({
          oldStatus: existing.status,
          newStatus: item.status,
          templateItemId: existing.templateItemId,
          notesChanged: (existing.notes ?? "") !== (item.notes ?? "")
        })
      }
    });

    return item;
  });

  const items = await prisma.inspectionItem.findMany({
    where: { inspectionId: updated.inspectionId },
    select: { status: true, notes: true }
  });

  return {
    ok: true,
    item: {
      id: updated.id,
      status: updated.status,
      notes: updated.notes,
      version: updated.version,
      updatedAt: updated.updatedAt.toISOString()
    },
    progress: calculateInspectionProgress(items)
  };
}
