import { describe, expect, it } from "vitest";
import { updateInspectionItemSchema } from "./validation";

describe("inspection item validation", () => {
  it("allows COMPLIANT without notes", () => {
    const result = updateInspectionItemSchema.safeParse({
      status: "COMPLIANT",
      notes: "",
      version: 1
    });

    expect(result.success).toBe(true);
  });

  it("rejects NON_COMPLIANT without notes", () => {
    const result = updateInspectionItemSchema.safeParse({
      status: "NON_COMPLIANT",
      notes: "",
      version: 1
    });

    expect(result.success).toBe(false);
  });

  it("rejects NOT_APPLICABLE without notes", () => {
    const result = updateInspectionItemSchema.safeParse({
      status: "NOT_APPLICABLE",
      notes: "",
      version: 1
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown status", () => {
    const result = updateInspectionItemSchema.safeParse({
      status: "UNKNOWN",
      notes: "",
      version: 1
    });

    expect(result.success).toBe(false);
  });
});
