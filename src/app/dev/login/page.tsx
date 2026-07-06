import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { isDevelopmentAuthEnabled } from "@/server/env";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function DevLoginPage({ searchParams }: Props) {
  if (!isDevelopmentAuthEnabled()) {
    notFound();
  }

  const params = await searchParams;
  const users = await prisma.user.findMany({
    where: {
      telegramUserId: {
        in: ["dev-inspector", "dev-quality-admin"]
      },
      isActive: true
    },
    orderBy: { role: "asc" },
    select: { id: true, fullName: true, role: true }
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-4 py-6">
      <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
        <h1 className="text-xl font-bold">وضع المصادقة التجريبي</h1>
        <p className="mt-2 leading-7">
          هذا المسار يعمل في التطوير فقط عند تفعيل DEV_AUTH_ENABLED.
        </p>
      </section>

      {params.error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-100">
          تعذر تسجيل الدخول بالمستخدم المحدد.
        </p>
      ) : null}

      <section className="grid gap-3">
        {users.map((user) => (
          <form action="/api/auth/dev" key={user.id} method="post">
            <input name="userId" type="hidden" value={user.id} />
            <button
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 text-right shadow-sm"
              type="submit"
            >
              <span className="block text-lg font-semibold">{user.fullName}</span>
              <span className="mt-1 block text-sm text-neutral-600 dark:text-neutral-300">
                {user.role === "QUALITY_ADMIN" ? "مسؤول الجودة" : "مفتش"}
              </span>
            </button>
          </form>
        ))}
      </section>
    </main>
  );
}
