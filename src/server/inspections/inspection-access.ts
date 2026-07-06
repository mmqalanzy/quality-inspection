import { canEditInspectionStatus } from "@/domain/inspections/statuses";
import { type SessionUser } from "@/server/auth/session-core";

export function canReadInspection(user: SessionUser, inspectorId: string): boolean {
  if (user.role === "QUALITY_ADMIN") {
    return true;
  }

  return user.role === "INSPECTOR" && user.id === inspectorId;
}

export function canEditInspection(
  user: SessionUser,
  inspection: { inspectorId: string; status: string }
): boolean {
  if (!canReadInspection(user, inspection.inspectorId)) {
    return false;
  }

  return canEditInspectionStatus(inspection.status);
}

export function canSubmitInspection(
  user: SessionUser,
  inspection: { inspectorId: string; status: string }
): boolean {
  if (user.role !== "INSPECTOR" || user.id !== inspection.inspectorId) {
    return false;
  }

  return inspection.status === "DRAFT" || inspection.status === "RETURNED";
}

export function canReviewInspection(user: SessionUser): boolean {
  return user.role === "QUALITY_ADMIN";
}
