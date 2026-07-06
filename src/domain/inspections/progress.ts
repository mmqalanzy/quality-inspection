import { type ItemStatus } from "./statuses";

export type ProgressItem = {
  status: string;
  notes: string | null;
};

export type InspectionProgress = {
  total: number;
  documented: number;
  compliant: number;
  nonCompliant: number;
  notApplicable: number;
  needsRecapture: number;
  notStarted: number;
  percent: number;
};

export function isDocumentedItem(item: ProgressItem): boolean {
  const notes = item.notes?.trim() ?? "";

  if (item.status === "COMPLIANT") {
    return true;
  }

  if (item.status === "NON_COMPLIANT" || item.status === "NOT_APPLICABLE") {
    return notes.length > 0;
  }

  return false;
}

export function calculateInspectionProgress(items: ProgressItem[]): InspectionProgress {
  const total = items.length;
  const documented = items.filter(isDocumentedItem).length;

  return {
    total,
    documented,
    compliant: countStatus(items, "COMPLIANT"),
    nonCompliant: countStatus(items, "NON_COMPLIANT"),
    notApplicable: countStatus(items, "NOT_APPLICABLE"),
    needsRecapture: countStatus(items, "NEEDS_RECAPTURE"),
    notStarted: countStatus(items, "NOT_STARTED"),
    percent: total === 0 ? 0 : Math.round((documented / total) * 100)
  };
}

function countStatus(items: ProgressItem[], status: ItemStatus): number {
  return items.filter((item) => item.status === status).length;
}
