import { notFound, redirect } from "next/navigation";
import { calculateInspectionProgress } from "@/domain/inspections/progress";
import { prisma } from "@/server/db";
import { type SessionUser } from "@/server/auth/session-core";
import { canReadInspection } from "./inspection-access";

export async function getInspectionForUser(user: SessionUser, inspectionId: string) {
  const inspection = await prisma.inspection.findUnique({
    where: { id: inspectionId },
    select: {
      id: true,
      workOrderNumber: true,
      location: true,
      workDescription: true,
      executionStatus: true,
      generalNotes: true,
      status: true,
      reviewNote: true,
      submittedAt: true,
      approvedAt: true,
      inspectorId: true,
      inspector: { select: { fullName: true } },
      reportFileId: true,
      reportMessageId: true,
      updatedAt: true,
      template: { select: { name: true } },
      city: { select: { name: true } },
      contractor: { select: { name: true } },
      items: {
        orderBy: { templateItem: { order: "asc" } },
        select: {
          id: true,
          status: true,
          notes: true,
          version: true,
          updatedAt: true,
          photos: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              storageKey: true,
              mimeType: true,
              fileSize: true,
              sortOrder: true
            }
          },
          templateItem: {
            select: {
              id: true,
              order: true,
              title: true,
              description: true,
              section: true,
              isRequired: true,
              minimumPhotos: true
            }
          }
        }
      }
    }
  });

  if (!inspection) notFound();

  if (!canReadInspection(user, inspection.inspectorId)) {
    redirect("/unauthorized" as never);
  }

  return {
    ...inspection,
    progress: calculateInspectionProgress(inspection.items)
  };
}

export async function getInspectionItemForUser(
  user: SessionUser,
  inspectionId: string,
  itemId: string
) {
  const inspection = await getInspectionForUser(user, inspectionId);
  const itemIndex = inspection.items.findIndex((item) => item.id === itemId);

  if (itemIndex < 0) notFound();

  return {
    inspection,
    item: inspection.items[itemIndex],
    previousItem: itemIndex > 0 ? inspection.items[itemIndex - 1] : null,
    nextItem: itemIndex < inspection.items.length - 1 ? inspection.items[itemIndex + 1] : null
  };
}
