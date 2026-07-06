import { z } from "zod";
import { executionStatuses, itemStatuses } from "./statuses";

export const createInspectionSchema = z.object({
  workOrderNumber: z
    .string()
    .trim()
    .min(1, "رقم أمر العمل مطلوب.")
    .max(30, "رقم أمر العمل طويل.")
    .regex(/^\d+$/, "رقم أمر العمل يقبل الأرقام فقط."),
  templateId: z.string().min(1, "قالب التفتيش مطلوب."),
  cityId: z.string().min(1, "المدينة مطلوبة."),
  contractorId: z.string().min(1, "المقاول مطلوب."),
  location: z.string().trim().min(2, "الموقع مطلوب.").max(120, "الموقع طويل."),
  workDescription: z
    .string()
    .trim()
    .min(3, "وصف العمل مطلوب.")
    .max(500, "وصف العمل طويل."),
  executionStatus: z.enum(executionStatuses, {
    message: "حالة التنفيذ غير صحيحة."
  }),
  generalNotes: z.string().trim().max(1000, "الملاحظات العامة طويلة.").optional()
});

export const updateInspectionItemSchema = z
  .object({
    status: z.enum(itemStatuses, {
      message: "حالة البند غير صحيحة."
    }),
    notes: z.string().trim().max(1000, "الملاحظة طويلة.").optional(),
    version: z.number().int().positive()
  })
  .superRefine((value, ctx) => {
    const notes = value.notes?.trim() ?? "";

    if (value.status === "NON_COMPLIANT" && notes.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["notes"],
        message: "الملاحظة مطلوبة عند اختيار غير مطابق."
      });
    }

    if (value.status === "NOT_APPLICABLE" && notes.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["notes"],
        message: "الملاحظة مطلوبة عند اختيار غير منطبق."
      });
    }
  });

export type CreateInspectionInput = z.infer<typeof createInspectionSchema>;
export type UpdateInspectionItemInput = z.infer<typeof updateInspectionItemSchema>;
