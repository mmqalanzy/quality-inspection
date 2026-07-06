"use client";

import { useEffect, useState } from "react";
import { getTelegramWebApp } from "@/telegram/webapp";

type Props = {
  devAuthEnabled: boolean;
};

export function TelegramAuthGateway({ devAuthEnabled }: Props) {
  const [message, setMessage] = useState("جاري فحص بيئة Telegram...");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const telegram = getTelegramWebApp();

    if (!telegram?.initData) {
      setMessage("لم يتم فتح التطبيق من داخل Telegram.");
      setIsError(true);
      return;
    }

    telegram.ready();
    telegram.expand();
    setMessage("جاري تسجيل الدخول عبر Telegram...");

    fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: telegram.initData })
    })
      .then(async (response) => {
        const result = (await response.json()) as {
          ok: boolean;
          needsRegistration?: boolean;
          message?: string;
        };

        if (result.needsRegistration) {
          window.location.assign("/register");
          return;
        }

        if (!response.ok || !result.ok) {
          throw new Error(result.message ?? "auth_failed");
        }

        window.location.assign("/app");
      })
      .catch(() => {
        setIsError(true);
        setMessage("تعذر تسجيل الدخول. تأكد من فتح التطبيق من زر البوت.");
      });
  }, []);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
      <h2 className="text-lg font-semibold">تسجيل الدخول</h2>
      <p className={`mt-3 leading-7 ${isError ? "text-red-700 dark:text-red-300" : ""}`}>
        {message}
      </p>
      {isError && devAuthEnabled ? (
        <a
          className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-[var(--primary)] px-4 py-3 font-semibold text-[var(--primary-foreground)]"
          href="/dev/login"
        >
          الدخول بوضع المصادقة التجريبي
        </a>
      ) : null}
    </div>
  );
}
