"use client";

import { useState } from "react";

type Props = {
  inspectionId: string;
};

type ReviewState = "idle" | "submitting" | "success" | "error";
type Decision = "approve" | "return";

export function ReviewActions({ inspectionId }: Props) {
  const [state, setState] = useState<ReviewState>("idle");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  async function handleReview(decision: Decision) {
    if (decision === "return" && !note.trim()) {
      setMessage("سبب الإرجاع مطلوب.");
      return;
    }

    setState("submitting");
    setDecision(decision);
    setMessage("");

    try {
      const response = await fetch(`/api/inspections/${inspectionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reviewNote: note.trim() || undefined })
      });

      const result = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !result.ok) {
        setState("error");
        setMessage(result.message ?? "تعذر تنفيذ العملية.");
        return;
      }

      setState("success");
      window.location.reload();
    } catch {
      setState("error");
      setMessage("تعذر الاتصال بالخادم.");
    }
  }

  if (state === "success") {
    return (
      <p className="rounded-lg bg-[var(--status-compliant-bg)] p-4 text-center font-bold text-[var(--status-compliant)]">
        ✓ تم التنفيذ بنجاح
      </p>
    );
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <h2 className="text-lg font-bold">مراجعة التفتيش</h2>

      <label className="mt-4 block text-sm font-semibold" htmlFor="review-note">
        ملاحظة المراجعة (اختيارية للاعتماد - مطلوبة للإرجاع)
      </label>
      <textarea
        id="review-note"
        className="mt-2 min-h-24 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"
        onChange={(e) => setNote(e.target.value)}
        placeholder="اكتب ملاحظاتك هنا..."
        value={note}
      />

      {message ? (
        <p className={`mt-3 text-sm font-semibold ${state === "error" ? "text-[var(--status-non-compliant)]" : "text-[var(--status-idle)]"}`}>
          {message}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          className="rounded-lg bg-[var(--status-compliant)] px-4 py-4 text-base font-bold text-white disabled:opacity-50"
          disabled={state === "submitting"}
          onClick={() => void handleReview("approve")}
          type="button"
        >
          {state === "submitting" && decision === "approve" ? "جاري الاعتماد..." : "اعتماد"}
        </button>
        <button
          className="rounded-lg bg-[var(--status-idle)] px-4 py-4 text-base font-bold text-white disabled:opacity-50"
          disabled={state === "submitting"}
          onClick={() => void handleReview("return")}
          type="button"
        >
          {state === "submitting" && decision === "return" ? "جاري الإرجاع..." : "إرجاع للتعديل"}
        </button>
      </div>
    </section>
  );
}
