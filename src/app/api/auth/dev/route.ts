import { NextResponse } from "next/server";
import { z } from "zod";
import { isUserRole } from "@/domain/roles";
import { prisma } from "@/server/db";
import { isDevelopmentAuthEnabled } from "@/server/env";
import {
  createSessionCookieValue,
  sessionCookieName,
  sessionCookieOptions
} from "@/server/auth/session";

const devAuthSchema = z.object({
  userId: z.string().min(1)
});

export async function POST(request: Request) {
  if (!isDevelopmentAuthEnabled()) {
    return NextResponse.json({ ok: false, message: "مسار التطوير غير متاح." }, { status: 404 });
  }

  const formData = await request.formData();
  const parsed = devAuthSchema.safeParse({ userId: formData.get("userId") });
  if (!parsed.success) {
    return NextResponse.redirect(new URL("/dev/login?error=invalid", request.url), 303);
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, isActive: true, role: true }
  });

  if (!user || !user.isActive || !isUserRole(user.role)) {
    return NextResponse.redirect(new URL("/dev/login?error=not_allowed", request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/app", request.url), 303);
  response.cookies.set(
    sessionCookieName,
    createSessionCookieValue(user.id),
    sessionCookieOptions()
  );
  return response;
}
