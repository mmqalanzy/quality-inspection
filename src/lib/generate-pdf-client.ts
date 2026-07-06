"use client";

export async function generatePdfFromElement(element: HTMLElement): Promise<Blob> {
  const html2pdf = (await import("html2pdf.js")).default;

  const opt = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename: "report.pdf",
    image: { type: "jpeg" as const, quality: 0.92 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      windowWidth: 794
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const }
  };

  return html2pdf().set(opt).from(element).output("blob") as Promise<Blob>;
}
