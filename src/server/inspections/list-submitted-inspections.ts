import { prisma } from "@/server/db";
import { type SessionUser } from "@/server/auth/session-core";

export async function listSubmittedInspections(user: SessionUser) {
  if (user.role !== "QUALITY_ADMIN") {
    return [];
  }

  const inspections = await prisma.inspection.findMany({
    where: { status: "SUBMITTED" },
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      workOrderNumber: true,
      status: true,
      submittedAt: true,
      inspector: { select: { fullName: true } },
      city: { select: { name: true } },
      contractor: { select: { name: true } }
    }
  });

  return inspections;
}

export async function listApprovedInspections(user: SessionUser) {
  if (user.role !== "QUALITY_ADMIN") {
    return [];
  }

  const inspections = await prisma.inspection.findMany({
    where: { status: "APPROVED", reportFileId: { not: null } },
    orderBy: { approvedAt: "desc" },
    take: 20,
    select: {
      id: true,
      workOrderNumber: true,
      status: true,
      approvedAt: true,
      inspector: { select: { fullName: true } },
      city: { select: { name: true } },
      contractor: { select: { name: true } }
    }
  });

  return inspections;
}
