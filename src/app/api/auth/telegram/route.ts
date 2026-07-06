import { NextResponse } from "next/server";
import { z } from "zod";
import { isUserRole } from "@/domain/roles";
import { prisma } from "@/server/db";
import { getServerEnv } from "@/server/env";
import {
  createSessionCookieValue,
  sessionCookieName,
  sessionCookieOptions
} from "@/server/auth/session";
import { verifyTelegramInitData } from "@/server/auth/telegram-init-data";

const telegramAuthSchema = z.object({
  initData: z.string().min(1).max(8192)
});

export async function POST(request: Request) {
  const body = telegramAuthSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ ok: false, message: "طلب المصادقة غير صالح." }, { status: 400 });
  }

  const env = getServerEnv();
  const verified = verifyTelegramInitData(body.data.initData, {
    botToken: env.TELEGRAM_BOT_TOKEN
  });

  if (!verified.ok) {
    return NextResponse.json({ ok: false, message: "تعذر التحقق من بيانات Telegram." }, { status: 401 });
  }

  const telegramUserId = String(verified.user.id);
  const user = await prisma.user.findUnique({
    where: { telegramUserId },
    select: { id: true, isActive: true, role: true }
  });

  if (user && (!user.isActive || !isUserRole(user.role))) {
    return NextResponse.json({ ok: false, message: "المستخدم غير مصرح له." }, { status: 403 });
  }

  if (!user) {
    return NextResponse.json({
      ok: false,
      needsRegistration: true,
      telegramUser: {
        id: verified.user.id,
        firstName: verified.user.first_name,
        lastName: verified.user.last_name,
        username: verified.user.username
      }
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      fullName: [verified.user.first_name, verified.user.last_name].filter(Boolean).join(" "),
      username: verified.user.username
    }
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    sessionCookieName,
    createSessionCookieValue(user.id),
    sessionCookieOptions()
  );
  return response;
}
