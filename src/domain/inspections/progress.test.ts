import { describe, expect, it } from "vitest";
import { calculateInspectionProgress } from "./progress";

describe("inspection progress", () => {
  it("returns 0% for 0 documented of 16", () => {
    const items = Array.from({ length: 16 }, () => ({
      status: "NOT_STARTED",
      notes: null
    }));

    expect(calculateInspectionProgress(items).percent).toBe(0);
  });

  it("returns 50% for 8 documented of 16", () => {
    const items = [
      ...Array.from({ length: 8 }, () => ({ status: "COMPLIANT", notes: null })),
      ...Array.from({ length: 8 }, () => ({ status: "NOT_STARTED", notes: null }))
    ];

    expect(calculateInspectionProgress(items).percent).toBe(50);
  });

  it("returns 100% for 16 documented of 16", () => {
    const items = Array.from({ length: 16 }, () => ({
      status: "COMPLIANT",
      notes: null
    }));

    expect(calculateInspectionProgress(items).percent).toBe(100);
  });

  it("does not count NEEDS_RECAPTURE as documented", () => {
    const progress = calculateInspectionProgress([
      { status: "NEEDS_RECAPTURE", notes: "صورة غير واضحة" }
    ]);

    expect(progress.documented).toBe(0);
  });

  it("counts NON_COMPLIANT with notes as documented", () => {
    const progress = calculateInspectionProgress([
      { status: "NON_COMPLIANT", notes: "يوجد خلل" }
    ]);

    expect(progress.documented).toBe(1);
  });

  it("does not count NOT_APPLICABLE without notes as documented", () => {
    const progress = calculateInspectionProgress([
      { status: "NOT_APPLICABLE", notes: null }
    ]);

    expect(progress.documented).toBe(0);
  });
});
