"use client";

import { forwardRef } from "react";
import { executionStatusArabic } from "@/domain/inspections/statuses";

export type PdfInspectionData = {
  workOrderNumber: string;
  inspectorName: string;
  contractorName: string;
  cityName: string;
  location: string;
  workDescription: string;
  executionStatus: string;
  generalNotes: string | null;
  submittedAt: string;
  items: {
    order: number;
    title: string;
    status: string;
    notes: string | null;
  }[];
  photos: {
    id: string;
    itemTitle: string;
    src: string;
  }[];
};

type Props = {
  data: PdfInspectionData;
};

const statusLabels: Record<string, string> = {
  NOT_STARTED: "لم يبدأ",
  COMPLIANT: "مطابق",
  NON_COMPLIANT: "غير مطابق",
  NOT_APPLICABLE: "غير منطبق",
  NEEDS_RECAPTURE: "يحتاج إعادة تصوير"
};

const pageStyle: React.CSSProperties = {
  width: "190mm",
  minHeight: "277mm",
  padding: "10mm",
  boxSizing: "border-box",
  backgroundColor: "#ffffff",
  color: "#111827",
  fontFamily: "'Noto Sans Arabic', 'Tahoma', sans-serif",
  fontSize: "10pt",
  lineHeight: 1.5,
  overflowWrap: "break-word",
  wordWrap: "break-word"
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "13pt",
  fontWeight: "bold",
  color: "#111827",
  marginBottom: "8px",
  marginTop: "16px",
  borderBottom: "1px solid #e5e7eb",
  paddingBottom: "4px"
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  border: "1px solid #9ca3af",
  fontSize: "9pt",
  marginBottom: "12px",
  tableLayout: "fixed"
};

const cellStyle: React.CSSProperties = {
  border: "1px solid #9ca3af",
  padding: "5px",
  verticalAlign: "top"
};

const labelCellStyle: React.CSSProperties = {
  ...cellStyle,
  backgroundColor: "#f3f4f6",
  fontWeight: "bold",
  width: "30%"
};

const headerCellStyle: React.CSSProperties = {
  ...cellStyle,
  backgroundColor: "#e5e7eb",
  fontWeight: "bold",
  textAlign: "center"
};

const photoBoxStyle: React.CSSProperties = {
  marginBottom: "16px",
  padding: "10px",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  pageBreakInside: "avoid",
  breakInside: "avoid"
};

export const PdfReportTemplate = forwardRef<HTMLDivElement, Props>(function PdfReportTemplate({ data }, ref) {
  const executionLabel = executionStatusArabic[data.executionStatus as keyof typeof executionStatusArabic] ?? data.executionStatus;

  const infoRows: [string, string | null][] = [
    ["رقم أمر العمل", data.workOrderNumber],
    ["التاريخ", data.submittedAt],
    ["اسم المفتش", data.inspectorName],
    ["المهندس / الاستشاري", "الحامد"],
    ["المقاول", data.contractorName],
    ["المدينة", data.cityName],
    ["الموقع", data.location],
    ["وصف العمل", data.workDescription],
    ["حالة التنفيذ", executionLabel]
  ];
  if (data.generalNotes) {
    infoRows.push(["ملاحظات عامة", data.generalNotes]);
  }

  return (
    <div id="pdf-report-template" ref={ref} dir="rtl" style={pageStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
          paddingBottom: "8px",
          borderBottom: "2px solid #bfa15f"
        }}
      >
        <div style={{ textAlign: "right", flex: 1 }}>
          <h1 style={{ fontSize: "18pt", fontWeight: "bold", color: "#111827", margin: 0 }}>تقرير توثيق الجودة</h1>
          <p style={{ fontSize: "10pt", color: "#6b7280", margin: "4px 0 0" }}>
            2H Consulting Office للاستشارات الهندسية
          </p>
        </div>
        <img
          alt="2H Consulting Office"
          src="/logo.png"
          crossOrigin="anonymous"
          decoding="async"
          style={{ height: "60px", width: "auto", objectFit: "contain", marginRight: "12px" }}
        />
      </div>

      <h2 style={sectionTitleStyle}>بيانات التفتيش</h2>
      <table style={tableStyle}>
        <tbody>
          {infoRows.map(([label, value]) => (
            <tr key={label}>
              <td style={labelCellStyle}>{label}</td>
              <td style={cellStyle}>{value || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={sectionTitleStyle}>جدول بنود التفتيش</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={{ ...headerCellStyle, width: "8%" }}>م</th>
            <th style={{ ...headerCellStyle, width: "42%" }}>البند</th>
            <th style={{ ...headerCellStyle, width: "18%" }}>الحالة</th>
            <th style={{ ...headerCellStyle, width: "32%" }}>ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item) => (
            <tr key={item.order} style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
              <td style={{ ...cellStyle, textAlign: "center" }}>{item.order}</td>
              <td style={cellStyle}>{item.title}</td>
              <td
                style={{
                  ...cellStyle,
                  textAlign: "center",
                  fontWeight: "bold",
                  color:
                    item.status === "NON_COMPLIANT"
                      ? "#b91c1c"
                      : item.status === "COMPLIANT"
                        ? "#15803d"
                        : "#111827"
                }}
              >
                {statusLabels[item.status] ?? item.status}
              </td>
              <td style={cellStyle}>{item.notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.photos.length > 0 ? (
        <>
          <h2 style={sectionTitleStyle}>الصور</h2>
          {data.photos.map((photo, index) => (
            <div key={photo.id} style={photoBoxStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  paddingBottom: "6px",
                  borderBottom: "1px solid #e5e7eb"
                }}
              >
                <span style={{ fontWeight: "bold", color: "#374151" }}>صورة {index + 1}</span>
                <span style={{ fontWeight: "bold", color: "#111827", fontSize: "9pt" }}>{photo.itemTitle}</span>
              </div>
              <img
                alt={`صورة ${index + 1}`}
                src={photo.src}
                crossOrigin="anonymous"
                decoding="async"
                style={{
                  display: "block",
                  margin: "0 auto",
                  maxWidth: "100%",
                  maxHeight: "220mm",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain"
                }}
              />
            </div>
          ))}
        </>
      ) : null}

      <p style={{ marginTop: "24px", textAlign: "center", fontSize: "8pt", color: "#9ca3af" }}>
        تم إنشاء هذا التقرير إلكترونيًا بواسطة نظام توثيق الجودة
      </p>
    </div>
  );
});
