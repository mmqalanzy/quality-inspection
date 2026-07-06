declare module "html2pdf.js" {
  interface Html2PdfOptions {
    margin?: number | [number, number] | [number, number, number, number];
    filename?: string;
    image?: { type?: "jpeg" | "png" | "webp"; quality?: number };
    html2canvas?: Record<string, unknown>;
    jsPDF?: { unit?: string; format?: string; orientation?: "portrait" | "landscape" };
  }

  interface Html2PdfInstance {
    set(options: Html2PdfOptions): Html2PdfInstance;
    from(element: HTMLElement): Html2PdfInstance;
    output(type: "blob" | "datauristring" | "arraybuffer" | "bloburi" | "base64"): Promise<Blob | string | ArrayBuffer>;
    save(filename?: string): void;
  }

  function html2pdf(): Html2PdfInstance;

  export default html2pdf;
}
