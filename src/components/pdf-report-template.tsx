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

export const PdfReportTemplate = forwardRef<HTMLDivElement, Props>(function PdfReportTemplate({ data }, ref) {
  const executionLabel = executionStatusArabic[data.executionStatus as keyof typeof executionStatusArabic] ?? data.executionStatus;

  return (
    <div
      id="pdf-report-template"
      ref={ref}
      dir="rtl"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "24px",
        backgroundColor: "#ffffff",
        color: "#000000",
        fontFamily: "'Noto Sans Arabic', 'Tahoma', sans-serif",
        fontSize: "12pt",
        lineHeight: 1.6
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "2px solid #bfa15f"
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#111827", margin: 0 }}>تقرير توثيق الجودة</h1>
          <p style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 0" }}>2H Consulting Office للاستشارات الهندسية</p>
        </div>
        <img alt="2H Consulting Office" src="/logo.png" style={{ height: "80px", width: "auto", objectFit: "contain" }} />
      </div>

      <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#111827", marginBottom: "12px" }}>بيانات التفتيش</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #d1d5db", fontSize: "12px", marginBottom: "24px" }}>
        <tbody>
          {[
            ["رقم أمر العمل", data.workOrderNumber],
            ["التاريخ", data.submittedAt],
            ["اسم المفتش", data.inspectorName],
            ["المهندس / الاستشاري", "الحامد"],
            ["المقاول", data.contractorName],
            ["المدينة", data.cityName],
            ["الموقع", data.location],
            ["وصف العمل", data.workDescription],
            ["حالة التنفيذ", executionLabel]
          ].map(([label, value]) => (
            <tr key={label} style={{ borderBottom: "1px solid #d1d5db" }}>
              <td
                style={{
                  width: "33%",
                  borderLeft: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  padding: "8px",
                  fontWeight: 600
                }}
              >
                {label}
              </td>
              <td style={{ padding: "8px" }}>{value || "-"}</td>
            </tr>
          ))}
          {data.generalNotes ? (
            <tr style={{ borderBottom: "1px solid #d1d5db" }}>
              <td
                style={{
                  width: "33%",
                  borderLeft: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  padding: "8px",
                  fontWeight: 600
                }}
              >
                ملاحظات عامة
              </td>
              <td style={{ padding: "8px" }}>{data.generalNotes}</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#111827", marginBottom: "12px" }}>جدول بنود التفتيش</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #d1d5db", fontSize: "12px", marginBottom: "32px" }}>
        <thead>
          <tr style={{ backgroundColor: "#f3f4f6" }}>
            <th style={{ border: "1px solid #d1d5db", padding: "8px" }}>م</th>
            <th style={{ border: "1px solid #d1d5db", padding: "8px" }}>البند</th>
            <th style={{ border: "1px solid #d1d5db", padding: "8px" }}>الحالة</th>
            <th style={{ border: "1px solid #d1d5db", padding: "8px" }}>ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item) => (
            <tr key={item.order} style={{ borderBottom: "1px solid #d1d5db" }}>
              <td style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "center" }}>{item.order}</td>
              <td style={{ border: "1px solid #d1d5db", padding: "8px" }}>{item.title}</td>
              <td
                style={{
                  border: "1px solid #d1d5db",
                  padding: "8px",
                  textAlign: "center",
                  fontWeight: 600,
                  color:
                    item.status === "NON_COMPLIANT"
                      ? "#b91c1c"
                      : item.status === "COMPLIANT"
                        ? "#15803d"
                        : "#000000"
                }}
              >
                {statusLabels[item.status] ?? item.status}
              </td>
              <td style={{ border: "1px solid #d1d5db", padding: "8px" }}>{item.notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.photos.length > 0 ? (
        <>
          <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#111827", marginBottom: "12px" }}>الصور</h2>
          {data.photos.map((photo, index) => (
            <div
              key={photo.id}
              style={{
                marginBottom: "24px",
                padding: "16px",
                border: "1px solid #d1d5db",
                pageBreakInside: "avoid"
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                  paddingBottom: "8px",
                  borderBottom: "1px solid #e5e7eb"
                }}
              >
                <span style={{ fontWeight: "bold", color: "#374151" }}>صورة {index + 1}</span>
                <span style={{ fontWeight: "bold", color: "#111827" }}>{photo.itemTitle}</span>
              </div>
              <img
                alt={`صورة ${index + 1}`}
                src={photo.src}
                style={{ display: "block", margin: "0 auto", maxHeight: "180mm", width: "auto", objectFit: "contain" }}
              />
            </div>
          ))}
        </>
      ) : null}

      <p style={{ marginTop: "32px", textAlign: "center", fontSize: "10px", color: "#9ca3af" }}>
        تم إنشاء هذا التقرير إلكترونيًا بواسطة نظام توثيق الجودة
      </p>
    </div>
  );
});
