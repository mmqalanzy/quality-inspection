"use client";

async function preloadImages(element: HTMLElement): Promise<void> {
  const images = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    images.map((img) => {
      return new Promise<void>((resolve) => {
        if (img.complete && img.naturalWidth > 0) {
          resolve();
          return;
        }

        const cleanup = () => {
          img.removeEventListener("load", onLoad);
          img.removeEventListener("error", onError);
        };

        const onLoad = () => {
          cleanup();
          resolve();
        };

        const onError = () => {
          cleanup();
          resolve();
        };

        img.addEventListener("load", onLoad);
        img.addEventListener("error", onError);

        // Force reload to trigger load event for cached images
        const src = img.src;
        img.src = "";
        img.src = src;
      });
    })
  );
}

export async function generatePdfFromElement(element: HTMLElement): Promise<Blob> {
  await preloadImages(element);

  const html2pdf = (await import("html2pdf.js")).default;

  const opt = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename: "report.pdf",
    image: { type: "jpeg" as const, quality: 0.92 },
    html2canvas: {
      scale: 1,
      useCORS: true,
      allowTaint: true,
      logging: false
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const }
  };

  return html2pdf().set(opt).from(element).output("blob") as Promise<Blob>;
}
