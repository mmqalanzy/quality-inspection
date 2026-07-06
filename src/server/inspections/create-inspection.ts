import { prisma } from "@/server/db";
import { type SessionUser } from "@/server/auth/session-core";
import {
  createInspectionSchema,
  type CreateInspectionInput
} from "@/domain/inspections/validation";

export type CreateInspectionResult =
  | { ok: true; inspectionId: string }
  | { ok: false; status: number; message: string; fieldErrors?: Record<string, string[]> };

export async function createInspection(
  user: SessionUser,
  input: unknown
): Promise<CreateInspectionResult> {
  const parsed = createInspectionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      message: "تحقق من بيانات التفتيش.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  if (user.role !== "INSPECTOR" && user.role !== "QUALITY_ADMIN") {
    return { ok: false, status: 403, message: "ليست لديك صلاحية إنشاء تفتيش." };
  }

  return createInspectionWithTransaction(user, parsed.data);
}

async function createInspectionWithTransaction(
  user: SessionUser,
  input: CreateInspectionInput
): Promise<CreateInspectionResult> {
  try {
    const inspection = await prisma.$transaction(async (tx) => {
      const [template, city, contractor] = await Promise.all([
        tx.inspectionTemplate.findFirst({
          where: { id: input.templateId, isActive: true },
          select: { id: true }
        }),
        tx.city.findFirst({
          where: { id: input.cityId, isActive: true },
          select: { id: true }
        }),
        tx.contractor.findFirst({
          where: { id: input.contractorId, isActive: true },
          select: { id: true }
        })
      ]);

      if (!template) throw new CreateInspectionError(400, "القالب المحدد غير متاح.");
      if (!city) throw new CreateInspectionError(400, "المدينة المحددة غير متاحة.");
      if (!contractor) throw new CreateInspectionError(400, "المقاول المحدد غير متاح.");

      const templateItems = await tx.templateItem.findMany({
        where: { templateId: template.id },
        orderBy: { order: "asc" },
        select: { id: true }
      });

      if (templateItems.length === 0) {
        throw new CreateInspectionError(400, "لا يمكن إنشاء تفتيش بلا بنود.");
      }

      const created = await tx.inspection.create({
        data: {
          workOrderNumber: input.workOrderNumber,
          templateId: template.id,
          inspectorId: user.id,
          contractorId: contractor.id,
          cityId: city.id,
          location: input.location,
          workDescription: input.workDescription,
          executionStatus: input.executionStatus,
          generalNotes: input.generalNotes || null,
          status: "DRAFT",
          items: {
            createMany: {
              data: templateItems.map((item) => ({
                templateItemId: item.id,
                status: "NOT_STARTED",
                version: 1
              }))
            }
          }
        },
        select: { id: true, workOrderNumber: true }
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "INSPECTION_CREATED",
          entityType: "Inspection",
          entityId: created.id,
          metadataJson: JSON.stringify({ workOrderNumber: created.workOrderNumber })
        }
      });

      return created;
    });

    return { ok: true, inspectionId: inspection.id };
  } catch (error) {
    if (error instanceof CreateInspectionError) {
      return { ok: false, status: error.status, message: error.message };
    }

    return { ok: false, status: 500, message: "تعذر إنشاء التفتيش." };
  }
}

class CreateInspectionError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}
