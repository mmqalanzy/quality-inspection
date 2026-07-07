"use client";

import { useState } from "react";

type Props = {
  inspectionId: string;
};

type RecallState = "idle" | "loading" | "success" | "error";

export function RecallForm({ inspectionId }: Props) {
  const [state, setState] = useState<RecallState>("idle");
  const [message, setMessage] = useState("");

  async function handleRecall() {
    if (state === "loading") return;

    if (!window.confirm("هل تريد إرجاع التقرير للتعديل؟")) {
      return;
    }

    setState("loading");
    setMessage("");

    try {
      const response = await fetch(`/api/inspections/${inspectionId}/recall`, {
        method: "POST"
      });
      const result = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !result.ok) {
        setState("error");
        setMessage(result.message ?? "تعذر إرجاع التقرير.");
        return;
      }

      setState("success");
      window.location.reload();
    } catch {
      setState("error");
      setMessage("تعذر الاتصال بالخادم.");
    }
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <h2 className="font-bold">إرجاع للتعديل</h2>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
        التقرير مرسل للمراجعة. يمكنك إرجاعه للتعديل إذا كنت بحاجة لتعديل بيانات أو صور.
      </p>

      {message ? (
        <p className={`mt-3 text-sm ${state === "error" ? "text-[var(--status-non-compliant)]" : ""}`}>
          {message}
        </p>
      ) : null}

      <button
        className="mt-4 w-full rounded-lg bg-[var(--status-idle)] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
        disabled={state === "loading"}
        onClick={() => void handleRecall()}
        type="button"
      >
        {state === "loading" ? "جاري الإرجاع..." : "إرجاع للتعديل"}
      </button>
    </section>
  );
}
