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

const registerSchema = z.object({
  initData: z.string().min(1).max(8192),
  fullName: z.string().min(2).max(100)
});

export async function POST(request: Request) {
  const body = registerSchema.safeParse(await request.json().catch(() => null));

  if (!body.success) {
    return NextResponse.json({ ok: false, message: "بيانات غير صالحة." }, { status: 400 });
  }

  const env = getServerEnv();
  const verified = verifyTelegramInitData(body.data.initData, {
    botToken: env.TELEGRAM_BOT_TOKEN
  });

  if (!verified.ok) {
    return NextResponse.json({ ok: false, message: "تعذر التحقق من بيانات Telegram." }, { status: 401 });
  }

  const telegramUserId = String(verified.user.id);

  const existing = await prisma.user.findUnique({
    where: { telegramUserId },
    select: { id: true, isActive: true, role: true }
  });

  if (existing) {
    if (!existing.isActive || !isUserRole(existing.role)) {
      return NextResponse.json({ ok: false, message: "المستخدم غير مصرح له." }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: existing.id },
      data: { fullName: body.data.fullName }
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      sessionCookieName,
      createSessionCookieValue(existing.id),
      sessionCookieOptions()
    );
    return response;
  }

  const user = await prisma.user.create({
    data: {
      telegramUserId,
      fullName: body.data.fullName,
      username: verified.user.username,
      role: "INSPECTOR",
      isActive: true
    },
    select: { id: true }
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    sessionCookieName,
    createSessionCookieValue(user.id),
    sessionCookieOptions()
  );
  return response;
}
