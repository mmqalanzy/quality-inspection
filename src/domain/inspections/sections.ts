export const itemSections = [
  "PRE_EXECUTION",
  "DURING_EXECUTION",
  "POST_EXECUTION"
] as const;

export type ItemSection = (typeof itemSections)[number];

export const itemSectionArabic: Record<ItemSection, string> = {
  PRE_EXECUTION: "قبل التنفيذ",
  DURING_EXECUTION: "أثناء التنفيذ",
  POST_EXECUTION: "بعد التنفيذ"
};

export const itemSectionIcon: Record<ItemSection, string> = {
  PRE_EXECUTION: "📋",
  DURING_EXECUTION: "🔧",
  POST_EXECUTION: "✅"
};

export function isItemSection(value: string): value is ItemSection {
  return itemSections.includes(value as ItemSection);
}

export function getItemSectionLabel(value: string): string {
  return isItemSection(value) ? itemSectionArabic[value] : value;
}

export function getItemSectionIcon(value: string): string {
  return isItemSection(value) ? itemSectionIcon[value] : "📌";
}

export function groupItemsBySection<T extends { templateItem: { section: string } }>(
  items: T[]
): Array<{ section: string; items: T[] }> {
  const groups: Array<{ section: string; items: T[] }> = [];

  for (const section of itemSections) {
    const sectionItems = items.filter((item) => item.templateItem.section === section);
    if (sectionItems.length > 0) {
      groups.push({ section, items: sectionItems });
    }
  }

  const unknownItems = items.filter(
    (item) => !isItemSection(item.templateItem.section)
  );
  if (unknownItems.length > 0) {
    groups.push({ section: "OTHER", items: unknownItems });
  }

  return groups;
}
