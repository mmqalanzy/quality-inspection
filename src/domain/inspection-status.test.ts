import { describe, expect, it } from "vitest";
import { itemStatusArabic, itemStatuses } from "./inspection-status";

describe("item status labels", () => {
  it("contains an Arabic label for every item status", () => {
    for (const status of itemStatuses) {
      expect(itemStatusArabic[status]).toBeTruthy();
    }
  });
});
