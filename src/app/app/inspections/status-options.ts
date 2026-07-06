import { itemStatusArabic, itemStatuses } from "@/domain/inspections/statuses";

export type StatusOption = {
  value: string;
  label: string;
  icon: string;
  colorVar: string;
  bgVar: string;
};

const statusStyleMap: Record<string, { icon: string; colorVar: string; bgVar: string }> = {
  NOT_STARTED: { icon: "⬜", colorVar: "--status-idle", bgVar: "--status-idle-bg" },
  COMPLIANT: { icon: "✅", colorVar: "--status-compliant", bgVar: "--status-compliant-bg" },
  NON_COMPLIANT: { icon: "❌", colorVar: "--status-non-compliant", bgVar: "--status-non-compliant-bg" },
  NOT_APPLICABLE: { icon: "⏭️", colorVar: "--status-not-applicable", bgVar: "--status-not-applicable-bg" },
  NEEDS_RECAPTURE: { icon: "🔄", colorVar: "--status-recapture", bgVar: "--status-recapture-bg" }
};

export function getStatusStyle(status: string) {
  return statusStyleMap[status] ?? statusStyleMap.NOT_STARTED;
}

export function buildStatusOptions(): StatusOption[] {
  return itemStatuses.map((status) => {
    const style = getStatusStyle(status);
    return {
      value: status,
      label: itemStatusArabic[status],
      icon: style.icon,
      colorVar: style.colorVar,
      bgVar: style.bgVar
    };
  });
}
