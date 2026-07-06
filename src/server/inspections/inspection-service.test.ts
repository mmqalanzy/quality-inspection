import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { type SessionUser } from "@/server/auth/session-core";
import { createInspection } from "./create-inspection";
import { listUserInspections } from "./list-user-inspections";
import { updateInspectionItem } from "./update-inspection-item";

const prefix = `9${Date.now()}`;
let inspector: SessionUser;
let otherInspector: SessionUser;
let cityId: string;
let contractorId: string;
let templateId: string;

describe("inspection services", () => {
  beforeAll(async () => {
    const [user, city, contractor, template] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { telegramUserId: "dev-inspector" } }),
      prisma.city.findFirstOrThrow({ where: { isActive: true } }),
      prisma.contractor.findFirstOrThrow({ where: { isActive: true } }),
      prisma.inspectionTemplate.findFirstOrThrow({ where: { isActive: true } })
    ]);

    const other = await prisma.user.upsert({
      where: { telegramUserId: "dev-other-inspector" },
      update: { isActive: true, role: "INSPECTOR", fullName: "مفتش آخر" },
      create: {
        telegramUserId: "dev-other-inspector",
        fullName: "مفتش آخر",
        role: "INSPECTOR",
        isActive: true
      }
    });

    inspector = {
      id: user.id,
      fullName: user.fullName,
      role: "INSPECTOR",
      isActive: true
    };
    otherInspector = {
      id: other.id,
      fullName: other.fullName,
      role: "INSPECTOR",
      isActive: true
    };
    cityId = city.id;
    contractorId = contractor.id;
    templateId = template.id;
  });

  afterAll(async () => {
    const inspections = await prisma.inspection.findMany({
      where: { workOrderNumber: { startsWith: prefix } },
      select: { id: true }
    });
    await prisma.inspection.deleteMany({
      where: { id: { in: inspections.map((inspection) => inspection.id) } }
    });
  });

  it("creates an inspection with NOT_STARTED items matching the template", async () => {
    const result = await createInspection(inspector, validInput(`${prefix}01`));

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const [items, templateItems] = await Promise.all([
      prisma.inspectionItem.findMany({
        where: { inspectionId: result.inspectionId },
        select: { status: true }
      }),
      prisma.templateItem.count({ where: { templateId } })
    ]);

    expect(items).toHaveLength(templateItems);
    expect(items.every((item) => item.status === "NOT_STARTED")).toBe(true);
  });

  it("rejects inactive template", async () => {
    const inactiveTemplate = await prisma.inspectionTemplate.create({
      data: { name: `${prefix}-inactive-template`, isActive: false }
    });
    const result = await createInspection(inspector, {
      ...validInput(`${prefix}02`),
      templateId: inactiveTemplate.id
    });

    expect(result.ok).toBe(false);
  });

  it("rejects inactive city", async () => {
    const inactiveCity = await prisma.city.create({
      data: { name: `${prefix}-inactive-city`, isActive: false }
    });
    const result = await createInspection(inspector, {
      ...validInput(`${prefix}03`),
      cityId: inactiveCity.id
    });

    expect(result.ok).toBe(false);
  });

  it("rejects inactive contractor", async () => {
    const inactiveContractor = await prisma.contractor.create({
      data: { name: `${prefix}-inactive-contractor`, isActive: false }
    });
    const result = await createInspection(inspector, {
      ...validInput(`${prefix}04`),
      contractorId: inactiveContractor.id
    });

    expect(result.ok).toBe(false);
  });

  it("lists only the current inspector inspections", async () => {
    const own = await createInspection(inspector, validInput(`${prefix}05`));
    await createInspection(otherInspector, validInput(`${prefix}06`));

    expect(own.ok).toBe(true);
    const listed = await listUserInspections(inspector);

    expect(listed.some((inspection) => inspection.workOrderNumber === `${prefix}05`)).toBe(true);
    expect(listed.some((inspection) => inspection.workOrderNumber === `${prefix}06`)).toBe(false);
  });

  it("rejects item update for another inspector inspection", async () => {
    const created = await createInspection(otherInspector, validInput(`${prefix}07`));
    if (!created.ok) throw new Error("failed setup");
    const item = await prisma.inspectionItem.findFirstOrThrow({
      where: { inspectionId: created.inspectionId }
    });

    const result = await updateInspectionItem(inspector, item.id, {
      status: "COMPLIANT",
      notes: "",
      version: item.version
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it("rejects updates on submitted inspections", async () => {
    const created = await createInspection(inspector, validInput(`${prefix}08`));
    if (!created.ok) throw new Error("failed setup");
    await prisma.inspection.update({
      where: { id: created.inspectionId },
      data: { status: "SUBMITTED" }
    });
    const item = await prisma.inspectionItem.findFirstOrThrow({
      where: { inspectionId: created.inspectionId }
    });

    const result = await updateInspectionItem(inspector, item.id, {
      status: "COMPLIANT",
      notes: "",
      version: item.version
    });

    expect(result.ok).toBe(false);
  });

  it("returns conflict on version mismatch", async () => {
    const created = await createInspection(inspector, validInput(`${prefix}09`));
    if (!created.ok) throw new Error("failed setup");
    const item = await prisma.inspectionItem.findFirstOrThrow({
      where: { inspectionId: created.inspectionId }
    });

    const result = await updateInspectionItem(inspector, item.id, {
      status: "COMPLIANT",
      notes: "",
      version: item.version + 1
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
  });
});

function validInput(workOrderNumber: string) {
  return {
    workOrderNumber,
    templateId,
    cityId,
    contractorId,
    location: "حي الاختبار",
    workDescription: "تركيب عداد تجريبي",
    executionStatus: "PLANNED",
    generalNotes: ""
  };
}
