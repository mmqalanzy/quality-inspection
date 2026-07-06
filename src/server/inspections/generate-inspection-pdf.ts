import fs from "node:fs";
import path from "node:path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import arabicReshaper from "arabic-reshaper";
import { executionStatusArabic, type ExecutionStatus } from "@/domain/inspections/statuses";
import { getSupabaseClient } from "@/server/storage/supabase-client";

export type InspectionPdfData = {
  workOrderNumber: string;
  inspectorName: string;
  contractorName: string;
  cityName: string;
  location: string;
  workDescription: string;
  executionStatus: string;
  generalNotes: string | null;
  approvedAt: string;
  items: { order: number; title: string; status: string; notes: string | null }[];
  photos: { storageKey: string; itemTitle: string; mimeType: string; buffer?: Uint8Array }[];
};

let fontBytes: Uint8Array | null = null;

function loadFont(): Uint8Array {
  if (fontBytes) return fontBytes;
  const fontPath = path.join(process.cwd(), "src", "assets", "fonts", "NotoSansArabic-Regular.ttf");
  fontBytes = fs.readFileSync(fontPath);
  return fontBytes;
}

function rtl(text: string): string {
  return arabicReshaper.convertArabic(text);
}

function statusLabel(status: string): string {
  const itemLabel: Record<string, string> = {
    NOT_STARTED: "لم يبدأ", COMPLIANT: "مطابق", NON_COMPLIANT: "غير مطابق",
    NOT_APPLICABLE: "غير منطبق", NEEDS_RECAPTURE: "يحتاج إعادة تصوير"
  };
  return itemLabel[status] ?? status;
}

function executionLabel(status: string): string {
  return executionStatusArabic[status as ExecutionStatus] ?? status;
}

export async function generateInspectionPdf(data: InspectionPdfData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const font = await pdfDoc.embedFont(loadFont());

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 40;
  const contentWidth = pageWidth - 2 * margin;
  let currentY = pageHeight - margin;

  const titleSize = 16;
  const headingSize = 12;
  const bodySize = 10;
  const smallSize = 8;
  const lineHeight = bodySize * 1.6;

  function drawRightAligned(page: ReturnType<typeof pdfDoc.addPage>, text: string, y: number, size: number, color = rgb(0, 0, 0)): number {
    const shaped = rtl(text);
    const w = font.widthOfTextAtSize(shaped, size);
    page.drawText(shaped, { x: margin + contentWidth - w, y, size, font, color });
    return y - size * 1.6;
  }

  function drawCentered(page: ReturnType<typeof pdfDoc.addPage>, text: string, y: number, size: number, color = rgb(0, 0, 0)): number {
    const shaped = rtl(text);
    const w = font.widthOfTextAtSize(shaped, size);
    page.drawText(shaped, { x: margin + (contentWidth - w) / 2, y, size, font, color });
    return y - size * 1.6;
  }

  function drawLine(page: ReturnType<typeof pdfDoc.addPage>, y: number): number {
    page.drawLine({ start: { x: margin, y }, end: { x: margin + contentWidth, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
    return y - 8;
  }

  function addPage(): ReturnType<typeof pdfDoc.addPage> {
    const p = pdfDoc.addPage([pageWidth, pageHeight]);
    currentY = pageHeight - margin;
    return p;
  }

  let page = addPage();

  currentY = drawCentered(page, "تقرير توثيق الجودة", currentY, titleSize, rgb(0.1, 0.3, 0.6));
  currentY -= 2;
  currentY = drawLine(page, currentY);
  currentY -= 2;

  const info = [
    `رقم أمر العمل: ${data.workOrderNumber}`,
    `اسم المفتش: ${data.inspectorName}`,
    `الاستشاري: الحامد`,
    `المقاول: ${data.contractorName}`,
    `المدينة: ${data.cityName}`,
    `الموقع: ${data.location}`,
    `وصف العمل: ${data.workDescription}`,
    `حالة التنفيذ: ${executionLabel(data.executionStatus)}`,
    `تاريخ الاعتماد: ${data.approvedAt}`
  ];
  for (const line of info) currentY = drawRightAligned(page, line, currentY, bodySize);
  if (data.generalNotes) currentY = drawRightAligned(page, `ملاحظات عامة: ${data.generalNotes}`, currentY, bodySize);

  currentY -= 6;
  currentY = drawLine(page, currentY);
  currentY -= 2;
  currentY = drawRightAligned(page, "جدول بنود التفتيش", currentY, headingSize, rgb(0.1, 0.3, 0.6));
  currentY -= 4;

  const cols = { notes: contentWidth - 40 - 210 - 80, status: 80, title: 210, order: 40 };
  const startX = margin;

  const headerY = currentY;
  const headers = [
    { t: "الملاحظات", w: cols.notes, x: startX },
    { t: "الحالة", w: cols.status, x: startX + cols.notes },
    { t: "البند", w: cols.title, x: startX + cols.notes + cols.status },
    { t: "م", w: cols.order, x: startX + cols.notes + cols.status + cols.title }
  ];
  for (const h of headers) {
    const s = rtl(h.t); const tw = font.widthOfTextAtSize(s, smallSize);
    page.drawText(s, { x: h.x + h.w - tw, y: headerY, size: smallSize, font, color: rgb(0.2, 0.2, 0.2) });
  }
  currentY = headerY - 2;
  currentY = drawLine(page, currentY);
  currentY -= 2;

  for (const item of data.items) {
    if (currentY < margin + 30) { page = addPage(); currentY = drawRightAligned(page, "تابع جدول بنود التفتيش", currentY, headingSize, rgb(0.1, 0.3, 0.6)); currentY -= 4; }
    const rowY = currentY;
    const c = item.status === "NON_COMPLIANT" ? rgb(0.8, 0.1, 0.1) : item.status === "COMPLIANT" ? rgb(0.1, 0.6, 0.1) : rgb(0, 0, 0);
    const ns = rtl(item.notes || "-"); const ss = rtl(statusLabel(item.status)); const ts = rtl(item.title); const os = rtl(String(item.order));
    page.drawText(ns, { x: startX + cols.notes - font.widthOfTextAtSize(ns, smallSize), y: rowY, size: smallSize, font, color: item.notes ? c : rgb(0.5, 0.5, 0.5) });
    page.drawText(ss, { x: startX + cols.notes + cols.status - font.widthOfTextAtSize(ss, smallSize), y: rowY, size: smallSize, font, color: c });
    page.drawText(ts, { x: startX + cols.notes + cols.status + cols.title - font.widthOfTextAtSize(ts, smallSize), y: rowY, size: smallSize, font });
    page.drawText(os, { x: startX + cols.notes + cols.status + cols.title + cols.order - font.widthOfTextAtSize(os, smallSize), y: rowY, size: smallSize, font });
    currentY = rowY - lineHeight;
  }
  currentY -= 4;
  currentY = drawLine(page, currentY);

  if (data.photos.length > 0) {
    page = addPage();
    currentY = drawRightAligned(page, "الصور", currentY, headingSize, rgb(0.1, 0.3, 0.6));
    currentY -= 8;

    const cardW = 240; const cardH = 190; const gap = 12;
    let cardX = margin;
    let rowBottom = currentY;

    for (const photo of data.photos) {
      if (cardX + cardW > margin + contentWidth) {
        cardX = margin;
        currentY = rowBottom - gap;
        rowBottom = currentY;
        if (currentY < margin + cardH) { page = addPage(); currentY = pageHeight - margin; rowBottom = currentY; }
      }

      const imgY = currentY - cardH + 30;
      page.drawRectangle({ x: cardX, y: imgY, width: cardW, height: cardH, borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 0.5 });

      const titleShaped = rtl(photo.itemTitle);
      const titleW = font.widthOfTextAtSize(titleShaped, 7);
      page.drawText(titleShaped, { x: cardX + cardW - titleW - 4, y: currentY - 2, size: 7, font, color: rgb(0.2, 0.2, 0.2) });

      if (photo.buffer) {
        try {
          let img;
          if (photo.buffer.length > 2 && photo.buffer[0] === 0xff && photo.buffer[1] === 0xd8) img = await pdfDoc.embedJpg(photo.buffer);
          else if (photo.buffer.length > 4 && photo.buffer[0] === 0x89 && photo.buffer[1] === 0x50) img = await pdfDoc.embedPng(photo.buffer);
          if (img) {
            const maxW = cardW - 16; const maxH = cardH - 36;
            const scale = Math.min(maxW / img.width, maxH / img.height);
            const iw = img.width * scale; const ih = img.height * scale;
            const ix = cardX + (cardW - iw) / 2; const iy = imgY + 8 + (maxH - ih) / 2;
            page.drawImage(img, { x: ix, y: iy, width: iw, height: ih });
          }
        } catch { drawMissingImage(page, cardX, imgY, cardW, cardH); }
      } else {
        drawMissingImage(page, cardX, imgY, cardW, cardH);
      }

      rowBottom = Math.min(rowBottom, imgY);
      cardX += cardW + gap;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function drawMissingImage(page: ReturnType<typeof PDFDocument["prototype"]["addPage"]>, x: number, y: number, w: number, h: number) {
  page.drawRectangle({ x: x + 8, y: y + 8, width: w - 16, height: h - 36, borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 0.5 });
}

export async function fetchPhotosFromSupabase(photos: { storageKey: string; itemTitle: string; mimeType: string }[]): Promise<InspectionPdfData["photos"]> {
  const supabase = getSupabaseClient();
  const result: InspectionPdfData["photos"] = [];
  for (const photo of photos) {
    try {
      const { data, error } = await supabase.storage.from("inspection-photos").download(photo.storageKey);
      if (error || !data) { result.push({ ...photo, buffer: undefined }); continue; }
      result.push({ ...photo, buffer: new Uint8Array(await data.arrayBuffer()) });
    } catch { result.push({ ...photo, buffer: undefined }); }
  }
  return result;
}
