"use client";

import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf
} from "@react-pdf/renderer";
import type { PdfInspectionData } from "@/components/pdf-report-template";

Font.register({
  family: "Amiri",
  fonts: [
    { src: "/fonts/Amiri-Regular.woff", fontWeight: "normal" },
    { src: "/fonts/Amiri-Bold.woff", fontWeight: "bold" }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Amiri",
    fontSize: 10,
    direction: "rtl"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: 2,
    borderBottomColor: "#bfa15f",
    paddingBottom: 10,
    marginBottom: 15
  },
  headerText: {
    alignItems: "flex-end"
  },
  title: {
    fontSize: 18,
    fontWeight: "bold"
  },
  subtitle: {
    fontSize: 9,
    color: "#666666",
    marginTop: 4
  },
  logo: {
    width: 50,
    height: 50,
    objectFit: "contain"
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
    borderBottom: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 3
  },
  table: {
    width: "100%",
    borderWidth: 0.5,
    borderColor: "#9ca3af",
    marginBottom: 15
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#9ca3af"
  },
  tableHeader: {
    backgroundColor: "#e5e7eb",
    fontWeight: "bold",
    textAlign: "center",
    padding: 4
  },
  tableCell: {
    padding: 4,
    borderLeftWidth: 0.5,
    borderLeftColor: "#9ca3af",
    textAlign: "right"
  },
  labelCell: {
    backgroundColor: "#f3f4f6",
    fontWeight: "bold",
    width: "30%",
    padding: 4,
    borderLeftWidth: 0.5,
    borderLeftColor: "#9ca3af"
  },
  valueCell: {
    width: "70%",
    padding: 4
  },
  statusCompliant: {
    color: "#15803d",
    fontWeight: "bold",
    textAlign: "center"
  },
  statusNonCompliant: {
    color: "#b91c1c",
    fontWeight: "bold",
    textAlign: "center"
  },
  statusDefault: {
    fontWeight: "bold",
    textAlign: "center"
  },
  photoBox: {
    marginBottom: 12,
    padding: 8,
    borderWidth: 0.5,
    borderColor: "#d1d5db"
  },
  photoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb"
  },
  photoImage: {
    width: "100%",
    maxHeight: 500,
    objectFit: "contain"
  },
  footer: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af"
  }
});

const statusLabels: Record<string, string> = {
  NOT_STARTED: "لم يبدأ",
  COMPLIANT: "مطابق",
  NON_COMPLIANT: "غير مطابق",
  NOT_APPLICABLE: "غير منطبق",
  NEEDS_RECAPTURE: "يحتاج إعادة تصوير"
};

type ReportDocumentProps = {
  data: PdfInspectionData;
};

function ReportDocument({ data }: ReportDocumentProps) {
  const infoRows: [string, string | null][] = [
    ["رقم أمر العمل", data.workOrderNumber],
    ["التاريخ", data.submittedAt],
    ["اسم المفتش", data.inspectorName],
    ["المهندس / الاستشاري", "الحامد"],
    ["المقاول", data.contractorName],
    ["المدينة", data.cityName],
    ["الموقع", data.location],
    ["وصف العمل", data.workDescription],
    ["حالة التنفيذ", data.executionStatus]
  ];

  if (data.generalNotes) {
    infoRows.push(["ملاحظات عامة", data.generalNotes]);
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>تقرير توثيق الجودة</Text>
            <Text style={styles.subtitle}>2H Consulting Office للاستشارات الهندسية</Text>
          </View>
          <Image src="/logo.png" style={styles.logo} />
        </View>

        <Text style={styles.sectionTitle}>بيانات التفتيش</Text>
        <View style={styles.table}>
          {infoRows.map(([label, value]) => (
            <View style={styles.tableRow} key={label}>
              <View style={styles.labelCell}>
                <Text>{label}</Text>
              </View>
              <View style={styles.valueCell}>
                <Text>{value || "-"}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>جدول بنود التفتيش</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, { backgroundColor: "#e5e7eb" }]}>
            <Text style={[styles.tableCell, { width: "8%", textAlign: "center", fontWeight: "bold" }]}>م</Text>
            <Text style={[styles.tableCell, { width: "42%", fontWeight: "bold" }]}>البند</Text>
            <Text style={[styles.tableCell, { width: "18%", textAlign: "center", fontWeight: "bold" }]}>الحالة</Text>
            <Text style={[styles.tableCell, { width: "32%", fontWeight: "bold", borderLeftWidth: 0 }]}>ملاحظات</Text>
          </View>
          {data.items.map((item) => {
            const statusStyle =
              item.status === "NON_COMPLIANT"
                ? styles.statusNonCompliant
                : item.status === "COMPLIANT"
                  ? styles.statusCompliant
                  : styles.statusDefault;
            return (
              <View style={styles.tableRow} key={item.order}>
                <Text style={[styles.tableCell, { width: "8%", textAlign: "center" }]}>{item.order}</Text>
                <Text style={[styles.tableCell, { width: "42%" }]}>{item.title}</Text>
                <Text style={[styles.tableCell, statusStyle, { width: "18%" }]}>
                  {statusLabels[item.status] ?? item.status}
                </Text>
                <Text style={[styles.tableCell, { width: "32%", borderLeftWidth: 0 }]}>{item.notes || "-"}</Text>
              </View>
            );
          })}
        </View>

        {data.photos.length > 0 ? (
          <View break>
            <Text style={styles.sectionTitle}>الصور</Text>
            {data.photos.map((photo, index) => (
              <View style={styles.photoBox} key={photo.id}>
                <View style={styles.photoHeader}>
                  <Text style={{ fontWeight: "bold" }}>صورة {index + 1}</Text>
                  <Text style={{ fontWeight: "bold", fontSize: 9 }}>{photo.itemTitle}</Text>
                </View>
                <Image src={photo.src} style={styles.photoImage} />
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.footer}>تم إنشاء هذا التقرير إلكترونيًا بواسطة نظام توثيق الجودة</Text>
      </Page>
    </Document>
  );
}

export async function generatePdfWithReactPdf(data: PdfInspectionData): Promise<Blob> {
  const blob = await pdf(<ReportDocument data={data} />).toBlob();
  return blob;
}
