"use client";

import { useEffect, useRef, useState } from "react";
import { triggerHaptic, triggerNotification } from "@/telegram/webapp";

type StatusOption = {
  value: string;
  label: string;
  icon: string;
  colorVar: string;
  bgVar: string;
};

type SaveState = "idle" | "saving" | "saved" | "error" | "conflict";

type Props = {
  itemId: string;
  statuses: StatusOption[];
  initialStatus: string;
  initialNotes: string;
  initialVersion: number;
};

const notesRequiredStatuses = new Set(["NON_COMPLIANT", "NOT_APPLICABLE"]);

export function InspectionItemEditor({
  itemId,
  statuses,
  initialStatus,
  initialNotes,
  initialVersion
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [version, setVersion] = useState(initialVersion);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const requestSeq = useRef(0);
  const lastSaved = useRef({ status: initialStatus, notes: initialNotes });
  const hasUnsaved = saveState === "saving" || saveState === "error" || saveState === "conflict";

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsaved) return;
      event.preventDefault();
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsaved]);

  useEffect(() => {
    if (status === lastSaved.current.status && notes === lastSaved.current.notes) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void save(status, notes);
    }, status === lastSaved.current.status ? 700 : 0);

    return () => window.clearTimeout(timeout);
  }, [status, notes]);

  async function save(nextStatus = status, nextNotes = notes) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const seq = requestSeq.current + 1;
    requestSeq.current = seq;
    setSaveState("saving");

    try {
      const response = await fetch(`/api/inspection-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, notes: nextNotes, version }),
        signal: controller.signal
      });
      const result = (await response.json()) as {
        ok: boolean;
        message?: string;
        item?: { status: string; notes: string | null; version: number };
        latest?: { status: string; notes: string | null; version: number };
      };

      if (seq !== requestSeq.current) return;

      if (response.status === 409 && result.latest) {
        setStatus(result.latest.status);
        setNotes(result.latest.notes ?? "");
        setVersion(result.latest.version);
        lastSaved.current = {
          status: result.latest.status,
          notes: result.latest.notes ?? ""
        };
        setSaveState("conflict");
        triggerNotification("warning");
        return;
      }

      if (!response.ok || !result.ok || !result.item) {
        setSaveState("error");
        setMessage(result.message ?? "تعذر الحفظ.");
        triggerNotification("error");
        return;
      }

      setVersion(result.item.version);
      lastSaved.current = {
        status: result.item.status,
        notes: result.item.notes ?? ""
      };
      setSaveState("saved");
      setMessage("");
      triggerNotification("success");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setSaveState("error");
      setMessage("تعذر الحفظ. تحقق من الاتصال.");
      triggerNotification("error");
    }
  }

  function selectStatus(value: string) {
    if (value === status) return;
    triggerHaptic("medium");
    setStatus(value);
  }

  const showNotes = notesRequiredStatuses.has(status);

  return (
    <section className="mt-3 grid gap-3">
      <div className="grid grid-cols-2 gap-2">
        {statuses.map((option) => {
          const selected = option.value === status;
          return (
            <button
              key={option.value}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 p-4 text-sm font-bold transition-colors ${
                selected
                  ? "text-white"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
              }`}
              onClick={() => selectStatus(option.value)}
              style={
                selected
                  ? { backgroundColor: `var(${option.colorVar})`, borderColor: `var(${option.colorVar})` }
                  : undefined
              }
              type="button"
            >
              <span className="text-lg">{option.icon}</span>
              {option.label}
            </button>
          );
        })}
      </div>

      {showNotes ? (
        <label className="grid gap-1">
          <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
            ملاحظة (مطلوبة)
          </span>
          <textarea
            className="min-h-24 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"
            onChange={(event) => setNotes(event.target.value)}
            placeholder="اكتب سبب المخالفة أو عدم الانطباق..."
            value={notes}
          />
        </label>
      ) : null}

      <div className="flex items-center gap-2 text-xs">
        {saveState === "saving" ? (
          <span className="text-neutral-500">جاري الحفظ...</span>
        ) : saveState === "saved" ? (
          <span className="text-[var(--status-compliant)]">✓ تم الحفظ</span>
        ) : saveState === "error" ? (
          <button className="font-semibold text-[var(--status-non-compliant)]" onClick={() => void save()} type="button">
            إعادة المحاولة
          </button>
        ) : saveState === "conflict" ? (
          <span className="text-[var(--status-recapture)]">تم تحديث النسخة. راجع وأعد الحفظ.</span>
        ) : null}
        {message && saveState === "error" ? <span className="text-neutral-500">{message}</span> : null}
      </div>
    </section>
  );
}
