"use client";

import { useState } from "react";
import { getTelegramWebApp } from "@/telegram/webapp";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [state, setState] = useState<"form" | "submitting" | "error">("form");
  const [message, setMessage] = useState("");

  const telegram = getTelegramWebApp();
  const initData = telegram?.initData ?? "";

  if (initData && !fullName && state === "form") {
    const params = new URLSearchParams(initData);
    const userJson = params.get("user");
    if (userJson) {
      try {
        const user = JSON.parse(userJson) as { first_name: string; last_name?: string };
        const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
        if (name) setFullName(name);
      } catch {
        // ignore
      }
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!initData) {
      setState("error");
      setMessage("لم يتم فتح التطبيق من داخل Telegram.");
      return;
    }

    if (!fullName.trim()) {
      setState("error");
      setMessage("الرجاء إدخال الاسم الكامل.");
      return;
    }

    setState("submitting");
    setMessage("جاري إنشاء الحساب...");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, fullName: fullName.trim() })
      });
      const result = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !result.ok) {
        setState("error");
        setMessage(result.message ?? "تعذر إنشاء الحساب.");
        return;
      }

      window.location.assign("/app");
    } catch {
      setState("error");
      setMessage("تعذر الاتصال بالخادم.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-4 py-6">
      <header className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <h1 className="text-xl font-bold">مرحبًا بك في نظام توثيق الجودة</h1>
        <p className="mt-2 text-sm leading-7">
          هذي أول مرة تدخل فيها. أكد اسمك الكامل للبدء. لن تحتاج لتسجيل الدخول مرة أخرى.
        </p>
      </header>

      <form className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="text-sm font-semibold">الاسم الكامل</span>
          <input
            className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-base"
            onChange={(event) => setFullName(event.target.value)}
            placeholder="اكتب اسمك الكامل"
            required
            type="text"
            value={fullName}
          />
        </label>

        {message ? (
          <p className={`text-sm ${state === "error" ? "text-red-700 dark:text-red-300" : ""}`}>
            {message}
          </p>
        ) : null}

        <button
          className="w-full rounded-lg bg-[var(--primary)] px-4 py-4 text-base font-bold text-[var(--primary-foreground)] disabled:opacity-50"
          disabled={state === "submitting"}
          type="submit"
        >
          {state === "submitting" ? "جاري الإنشاء..." : "تأكيد وبدء العمل"}
        </button>
      </form>
    </main>
  );
}
