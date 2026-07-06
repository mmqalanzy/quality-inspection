"use client";

import { useState } from "react";

type Option = { id: string; name: string };
type StatusOption = { value: string; label: string };

type Props = {
  cities: Option[];
  contractors: Option[];
  templates: Option[];
  executionStatuses: StatusOption[];
};

export function NewInspectionForm({
  cities,
  contractors,
  templates,
  executionStatuses
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as { ok: boolean; inspectionId?: string; message?: string };

      if (!response.ok || !result.ok || !result.inspectionId) {
        setMessage(result.message ?? "تعذر إنشاء التفتيش.");
        return;
      }

      window.location.assign(`/app/inspections/${result.inspectionId}`);
    } catch {
      setMessage("تعذر إنشاء التفتيش. تحقق من الاتصال وأعد المحاولة.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <Field label="رقم أمر العمل" name="workOrderNumber" inputMode="numeric" required />
      <Select label="قالب التفتيش" name="templateId" options={templates} required />
      <Select label="المدينة" name="cityId" options={cities} required />
      <Select label="المقاول" name="contractorId" options={contractors} required />
      <Field label="الموقع أو الحي" name="location" required />
      <Field label="وصف العمل" name="workDescription" required textarea />
      <label className="grid gap-2">
        <span className="font-semibold">حالة التنفيذ</span>
        <select className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3" name="executionStatus" required>
          {executionStatuses.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </label>
      <Field label="ملاحظات عامة" name="generalNotes" textarea />
      {message ? <p className="rounded-md border border-red-300 bg-red-50 p-3 text-red-800">{message}</p> : null}
      <button className="rounded-md bg-[var(--primary)] px-4 py-3 font-semibold text-[var(--primary-foreground)] disabled:opacity-60" disabled={isSubmitting} type="submit">
        {isSubmitting ? "جاري الإنشاء..." : "إنشاء التفتيش"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  textarea,
  inputMode
}: {
  label: string;
  name: string;
  required?: boolean;
  textarea?: boolean;
  inputMode?: "numeric";
}) {
  return (
    <label className="grid gap-2">
      <span className="font-semibold">{label}</span>
      {textarea ? (
        <textarea className="min-h-24 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3" name={name} required={required} />
      ) : (
        <input className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3" inputMode={inputMode} name={name} required={required} />
      )}
    </label>
  );
}

function Select({
  label,
  name,
  options,
  required
}: {
  label: string;
  name: string;
  options: Option[];
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="font-semibold">{label}</span>
      <select className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3" name={name} required={required}>
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.name}</option>
        ))}
      </select>
    </label>
  );
}
