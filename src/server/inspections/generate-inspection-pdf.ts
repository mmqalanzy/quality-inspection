import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { executionStatusArabic, type ExecutionStatus } from "@/domain/inspections/statuses";
import { getSupabaseClient } from "@/server/supabase/supabase-client";

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

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    NOT_STARTED: "لم يبدأ",
    COMPLIANT: "مطابق",
    NON_COMPLIANT: "غير مطابق",
    NOT_APPLICABLE: "غير منطبق",
    NEEDS_RECAPTURE: "يحتاج إعادة تصوير"
  };
  return labels[status] ?? status;
}

function executionLabel(status: string): string {
  return executionStatusArabic[status as ExecutionStatus] ?? status;
}

function toBase64Image(buffer: Uint8Array, mimeType: string): string {
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

function loadLogoBase64(): string | null {
  try {
    const logoPath = path.join(process.cwd(), "src", "assets", "logo.png");
    if (!fs.existsSync(logoPath)) return null;
    const buffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

async function getBrowser() {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    console.log("[PDF] Resolving Chromium executable for production...");
    const executablePath = await chromium.executablePath();
    console.log("[PDF] Chromium executable:", executablePath);
    return puppeteer.launch({
      executablePath,
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      headless: true
    });
  }

  const localChromePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe` : "",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  ];

  for (const chromePath of localChromePaths) {
    if (chromePath && fs.existsSync(chromePath)) {
      return puppeteer.launch({ executablePath: chromePath, headless: true });
    }
  }

  throw new Error(
    "Chrome not found. Please install Google Chrome or set CHROME_PATH environment variable."
  );
}

export async function fetchPhotosFromSupabase(
  photos: { storageKey: string; itemTitle: string; mimeType: string }[]
): Promise<InspectionPdfData["photos"]> {
  const supabase = getSupabaseClient();
  const result: InspectionPdfData["photos"] = [];
  for (const photo of photos) {
    try {
      const { data, error } = await supabase.storage.from("inspection-photos").download(photo.storageKey);
      if (error || !data) {
        result.push({ ...photo, buffer: undefined });
        continue;
      }
      result.push({ ...photo, buffer: new Uint8Array(await data.arrayBuffer()) });
    } catch {
      result.push({ ...photo, buffer: undefined });
    }
  }
  return result;
}

export async function generateInspectionPdf(data: InspectionPdfData): Promise<Buffer> {
  const logoBase64 = loadLogoBase64();

  const infoRows = [
    { label: "رقم أمر العمل", value: data.workOrderNumber },
    { label: "التاريخ", value: data.approvedAt },
    { label: "اسم المفتش", value: data.inspectorName },
    { label: "المهندس / الاستشاري", value: "الحامد" },
    { label: "المقاول", value: data.contractorName },
    { label: "المدينة", value: data.cityName },
    { label: "الموقع", value: data.location },
    { label: "وصف العمل", value: data.workDescription },
    { label: "حالة التنفيذ", value: executionLabel(data.executionStatus) }
  ];

  const generalNotesRow = data.generalNotes
    ? `<tr><td class="label">ملاحظات عامة</td><td class="value">${data.generalNotes}</td></tr>`
    : "";

  const itemsRows = data.items
    .map(
      (item) => `
    <tr>
      <td>${item.order}</td>
      <td>${item.title}</td>
      <td class="status ${item.status === "NON_COMPLIANT" ? "non-compliant" : item.status === "COMPLIANT" ? "compliant" : ""}">${statusLabel(item.status)}</td>
      <td>${item.notes ?? "-"}</td>
    </tr>
  `
    )
    .join("");

  const photoPages = data.photos
    .map((photo, index) => {
      const imageSrc = photo.buffer ? toBase64Image(photo.buffer, photo.mimeType) : "";
      const imageHtml = imageSrc
        ? `<img src="${imageSrc}" alt="صورة ${index + 1}" />`
        : `<div class="missing-image">تعذر تحميل الصورة</div>`;
      return `
      <div class="photo-page">
        <div class="photo-card">
          <div class="photo-header">
            <span class="photo-number">صورة ${index + 1}</span>
            <span class="photo-item">${photo.itemTitle}</span>
          </div>
          <div class="photo-body">
            ${imageHtml}
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" class="logo" alt="2H Consulting Office" />`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>تقرير توثيق الجودة - ${data.workOrderNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Noto Sans Arabic", "Tahoma", sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #1f2937;
      background: #fff;
    }
    @page {
      size: A4;
      margin: 20mm;
    }
    .page {
      width: 100%;
      padding: 10mm;
      page-break-after: always;
    }
    .page:last-child {
      page-break-after: auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #bfa15f;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .header-title {
      text-align: center;
      flex: 1;
    }
    .header-title h1 {
      font-size: 18pt;
      color: #1f2937;
      margin-bottom: 4px;
    }
    .header-title h2 {
      font-size: 12pt;
      color: #6b7280;
      font-weight: 400;
    }
    .logo {
      width: 80px;
      height: auto;
      object-fit: contain;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .info-table td {
      border: 1px solid #e5e7eb;
      padding: 8px 12px;
      vertical-align: top;
    }
    .info-table .label {
      background: #f9fafb;
      width: 30%;
      font-weight: 600;
      color: #4b5563;
    }
    .info-table .value {
      width: 70%;
    }
    .section-title {
      font-size: 14pt;
      font-weight: 700;
      color: #1f2937;
      margin: 20px 0 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
    }
    .items-table th,
    .items-table td {
      border: 1px solid #e5e7eb;
      padding: 8px;
      text-align: right;
      vertical-align: top;
    }
    .items-table th {
      background: #f3f4f6;
      font-weight: 600;
    }
    .status.compliant { color: #15803d; font-weight: 600; }
    .status.non-compliant { color: #b91c1c; font-weight: 600; }
    .photo-page {
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      page-break-after: always;
      padding: 10mm;
    }
    .photo-page:last-child {
      page-break-after: auto;
    }
    .photo-card {
      width: 100%;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    }
    .photo-header {
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .photo-number {
      font-weight: 700;
      color: #6b7280;
    }
    .photo-item {
      font-weight: 700;
      color: #1f2937;
    }
    .photo-body {
      padding: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 500px;
      background: #fafafa;
    }
    .photo-body img {
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
      border-radius: 4px;
    }
    .missing-image {
      width: 100%;
      height: 300px;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #9ca3af;
      border: 2px dashed #e5e7eb;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      font-size: 9pt;
      color: #9ca3af;
      margin-top: 12px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-title">
        <h1>تقرير توثيق الجودة</h1>
        <h2>2H Consulting Office للاستشارات الهندسية</h2>
      </div>
      ${logoHtml}
    </div>

    <div class="section-title">بيانات التفتيش</div>
    <table class="info-table">
      ${infoRows.map((row) => `<tr><td class="label">${row.label}</td><td class="value">${row.value}</td></tr>`).join("")}
      ${generalNotesRow}
    </table>

    <div class="section-title">جدول بنود التفتيش</div>
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 8%">م</th>
          <th style="width: 40%">البند</th>
          <th style="width: 18%">الحالة</th>
          <th style="width: 34%">ملاحظات</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="footer">
      تم إنشاء هذا التقرير إلكترونيًا بواسطة نظام توثيق الجودة
    </div>
  </div>

  ${photoPages}
</body>
</html>
  `;

  let browser;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true
    });
    return Buffer.from(pdf);
  } finally {
    if (browser) await browser.close();
  }
}
