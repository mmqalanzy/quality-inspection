"use client";

import { useEffect, useRef, useState } from "react";
import { PdfReportTemplate, type PdfInspectionData } from "./pdf-report-template";
import { generatePdfFromElement } from "@/lib/generate-pdf-client";

type Props = {
  inspectionId: string;
  canSubmit: boolean;
  validationWarnings: string[];
  inspectionData: PdfInspectionData;
};

type SubmitState = "idle" | "preparing" | "generating" | "submitting" | "success" | "error";

export function SubmitForm({ inspectionId, canSubmit, validationWarnings, inspectionData }: Props) {
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const templateRef = useRef<HTMLDivElement>(null);
  const hasStartedGeneration = useRef(false);

  useEffect(() => {
    if (submitState !== "preparing" || hasStartedGeneration.current) return;
    if (!templateRef.current) return;

    hasStartedGeneration.current = true;

    void (async () => {
      setSubmitState("generating");
      setMessage("");

      let pdfBlob: Blob;
      try {
        pdfBlob = await generatePdfFromElement(templateRef.current!);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setSubmitState("error");
        setMessage(`تعذر إنشاء التقرير: ${errorMessage}`);
        hasStartedGeneration.current = false;
        return;
      }

      setSubmitState("submitting");

      const formData = new FormData();
      formData.append("report", pdfBlob, `تقرير_${inspectionData.workOrderNumber}.pdf`);

      try {
        const response = await fetch(`/api/inspections/${inspectionId}/submit`, {
          method: "POST",
          body: formData
        });
        const result = (await response.json()) as { ok: boolean; message?: string };

        if (!response.ok || !result.ok) {
          setSubmitState("error");
          setMessage(result.message ?? "تعذر إرسال التفتيش.");
          hasStartedGeneration.current = false;
          return;
        }

        setSubmitState("success");
        window.location.assign("/app/inspections");
      } catch {
        setSubmitState("error");
        setMessage("تعذر الاتصال بالخادم.");
        hasStartedGeneration.current = false;
      }
    })();
  }, [submitState, inspectionData.workOrderNumber, inspectionId]);

  function handleSubmit() {
    if (!canSubmit) return;
    hasStartedGeneration.current = false;
    setSubmitState("preparing");
  }

  const showOverlay = submitState === "preparing" || submitState === "generating" || submitState === "submitting";

  const buttonText =
    submitState === "preparing"
      ? "جاري التحضير..."
      : submitState === "generating"
        ? "جاري إنشاء التقرير..."
        : submitState === "submitting"
          ? "جاري الإرسال..."
          : "إرسال للمراجعة";

  return (
    <>
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="font-bold">إرسال للمراجعة</h2>

        {validationWarnings.length > 0 ? (
          <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              لا يمكن الإرسال حتى يتم استكمال:
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-amber-800 dark:text-amber-200">
              {validationWarnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {message ? (
          <p className={`mt-3 text-sm ${submitState === "error" ? "text-[var(--status-non-compliant)]" : ""}`}>
            {message}
          </p>
        ) : null}

        {submitState === "success" ? (
          <p className="mt-3 text-sm font-bold text-[var(--status-compliant)]">✓ تم الإرسال بنجاح</p>
        ) : (
          <button
            className="mt-4 w-full rounded-lg bg-[var(--primary)] px-4 py-4 text-base font-bold text-[var(--primary-foreground)] disabled:opacity-50"
            disabled={!canSubmit || showOverlay}
            onClick={() => void handleSubmit()}
            type="button"
          >
            {buttonText}
          </button>
        )}
      </section>

      {showOverlay ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 text-white">
          <p className="text-center text-lg font-bold">
            {submitState === "preparing"
              ? "جاري التحضير..."
              : submitState === "generating"
                ? "جاري إنشاء التقرير..."
                : "جاري إرسال التقرير..."}
          </p>
        </div>
      ) : null}

      {showOverlay ? (
        <div
          className="fixed left-0 top-0 -z-40"
          style={{ width: "210mm", pointerEvents: "none" }}
        >
          <PdfReportTemplate ref={templateRef} data={inspectionData} />
        </div>
      ) : null}
    </>
  );
}
