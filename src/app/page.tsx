import { listSeedOverview } from "@/server/bootstrap/seed-overview";
import { isDevelopmentAuthEnabled } from "@/server/env";
import { TelegramAuthGateway } from "./telegram-auth-gateway";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const overview = await listSeedOverview();
  const devAuthEnabled = isDevelopmentAuthEnabled();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 px-4 py-6">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <p className="text-sm text-[var(--primary)]">المرحلة الأولى</p>
        <h1 className="mt-2 text-2xl font-bold">نظام توثيق الجودة</h1>
        <p className="mt-3 leading-7 text-neutral-700 dark:text-neutral-200">
          هذا الهيكل الأولي يجهز مشروع Telegram Mini App بقاعدة SQLite وPrisma
          وبيانات seed قابلة للتطوير قبل بدء مرحلة المصادقة.
        </p>
      </section>

      <TelegramAuthGateway devAuthEnabled={devAuthEnabled} />

      <section className="grid gap-3">
        {overview.map((item) => (
          <article
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
            key={item.label}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{item.label}</h2>
              <span className="rounded-md bg-[var(--surface-muted)] px-3 py-1 text-sm">
                {item.count}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              {item.description}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
