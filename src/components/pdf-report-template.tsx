"use client";

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

export function PdfReportTemplate({ data }: Props) {
  const executionLabel = executionStatusArabic[data.executionStatus as keyof typeof executionStatusArabic] ?? data.executionStatus;

  return (
    <div
      id="pdf-report-template"
      dir="rtl"
      className="bg-white p-8 text-black"
      style={{
        width: "210mm",
        minHeight: "297mm",
        fontFamily: "'Noto Sans Arabic', 'Tahoma', sans-serif",
        fontSize: "12pt",
        lineHeight: 1.6
      }}
    >
      <div className="mb-6 flex items-center justify-between border-b-2 border-[#bfa15f] pb-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">تقرير توثيق الجودة</h1>
          <p className="text-sm text-gray-500">2H Consulting Office للاستشارات الهندسية</p>
        </div>
        <img
          alt="2H Consulting Office"
          src="/logo.png"
          className="h-20 w-auto object-contain"
        />
      </div>

      <h2 className="mb-3 text-lg font-bold text-gray-900">بيانات التفتيش</h2>
      <table className="mb-6 w-full border-collapse border border-gray-300 text-sm">
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
            <tr key={label} className="border-b border-gray-300">
              <td className="w-1/3 border-l border-gray-300 bg-gray-50 p-2 font-semibold">{label}</td>
              <td className="p-2">{value || "-"}</td>
            </tr>
          ))}
          {data.generalNotes ? (
            <tr className="border-b border-gray-300">
              <td className="w-1/3 border-l border-gray-300 bg-gray-50 p-2 font-semibold">ملاحظات عامة</td>
              <td className="p-2">{data.generalNotes}</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <h2 className="mb-3 text-lg font-bold text-gray-900">جدول بنود التفتيش</h2>
      <table className="mb-8 w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">م</th>
            <th className="border border-gray-300 p-2">البند</th>
            <th className="border border-gray-300 p-2">الحالة</th>
            <th className="border border-gray-300 p-2">ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item) => (
            <tr key={item.order} className="border-b border-gray-300">
              <td className="border border-gray-300 p-2 text-center">{item.order}</td>
              <td className="border border-gray-300 p-2">{item.title}</td>
              <td
                className={`border border-gray-300 p-2 text-center font-semibold ${
                  item.status === "NON_COMPLIANT"
                    ? "text-red-700"
                    : item.status === "COMPLIANT"
                      ? "text-green-700"
                      : ""
                }`}
              >
                {statusLabels[item.status] ?? item.status}
              </td>
              <td className="border border-gray-300 p-2">{item.notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.photos.length > 0 ? (
        <>
          <h2 className="mb-3 text-lg font-bold text-gray-900">الصور</h2>
          {data.photos.map((photo, index) => (
            <div
              key={photo.id}
              className="mb-6 break-inside-avoid border border-gray-300 p-4"
              style={{ pageBreakInside: "avoid" }}
            >
              <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="font-bold text-gray-700">صورة {index + 1}</span>
                <span className="font-bold text-gray-900">{photo.itemTitle}</span>
              </div>
              <img
                alt={`صورة ${index + 1}`}
                src={photo.src}
                className="mx-auto max-h-[180mm] w-auto object-contain"
              />
            </div>
          ))}
        </>
      ) : null}

      <p className="mt-8 text-center text-xs text-gray-400">
        تم إنشاء هذا التقرير إلكترونيًا بواسطة نظام توثيق الجودة
      </p>
    </div>
  );
}
