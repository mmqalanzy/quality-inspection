export const executionStatuses = [
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "INSPECTED",
  "ENERGIZED",
  "ASPHALT_RESTORED"
] as const;

export const inspectionStatuses = [
  "DRAFT",
  "SUBMITTED",
  "RETURNED",
  "APPROVED",
  "CANCELLED"
] as const;

export const itemStatuses = [
  "NOT_STARTED",
  "COMPLIANT",
  "NON_COMPLIANT",
  "NOT_APPLICABLE",
  "NEEDS_RECAPTURE"
] as const;

export type ExecutionStatus = (typeof executionStatuses)[number];
export type InspectionStatus = (typeof inspectionStatuses)[number];
export type ItemStatus = (typeof itemStatuses)[number];

export const executionStatusArabic: Record<ExecutionStatus, string> = {
  PLANNED: "مخطط",
  IN_PROGRESS: "جاري العمل",
  COMPLETED: "تم التنفيذ",
  INSPECTED: "تم الفحص",
  ENERGIZED: "تم إطلاق التيار",
  ASPHALT_RESTORED: "تمت إعادة الأسفلت"
};

export const inspectionStatusArabic: Record<InspectionStatus, string> = {
  DRAFT: "مسودة",
  SUBMITTED: "مرسل للمراجعة",
  RETURNED: "مرجع",
  APPROVED: "معتمد",
  CANCELLED: "ملغى"
};

export const itemStatusArabic: Record<ItemStatus, string> = {
  NOT_STARTED: "لم يبدأ",
  COMPLIANT: "مطابق",
  NON_COMPLIANT: "غير مطابق",
  NOT_APPLICABLE: "غير منطبق",
  NEEDS_RECAPTURE: "يحتاج إعادة تصوير"
};

export function isExecutionStatus(value: string): value is ExecutionStatus {
  return executionStatuses.includes(value as ExecutionStatus);
}

export function isInspectionStatus(value: string): value is InspectionStatus {
  return inspectionStatuses.includes(value as InspectionStatus);
}

export function isItemStatus(value: string): value is ItemStatus {
  return itemStatuses.includes(value as ItemStatus);
}

export function canEditInspectionStatus(status: string): boolean {
  return status === "DRAFT" || status === "RETURNED";
}
