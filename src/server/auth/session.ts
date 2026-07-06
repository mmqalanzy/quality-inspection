import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { canAccessAdmin, isUserRole, type UserRole } from "@/domain/roles";
import { getServerEnv } from "@/server/env";
import { prisma } from "@/server/db";
import {
  createSessionToken,
  resolveSessionUser,
  sessionTtlSeconds,
  type SessionUser
} from "./session-core";

export const sessionCookieName = "quality_session";

export function createSessionCookieValue(userId: string): string {
  const env = getServerEnv();
  return createSessionToken(userId, { secret: env.SESSION_SECRET });
}

export function sessionCookieOptions() {
  const env = getServerEnv();
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: sessionTtlSeconds
  };
}

export async function readSession(): Promise<SessionUser | null> {
  const env = getServerEnv();
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  return resolveSessionUser(token, { secret: env.SESSION_SECRET }, async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, role: true, isActive: true }
    });

    if (!user || !isUserRole(user.role)) {
      return null;
    }

    return {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive
    };
  });
}

export async function requireUser(): Promise<SessionUser> {
  const user = await readSession();

  if (!user) {
    redirect("/");
  }

  return user;
}

export async function requireRole(role: UserRole): Promise<SessionUser> {
  const user = await requireUser();

  if (role === "QUALITY_ADMIN" && !canAccessAdmin(user.role)) {
    redirect("/unauthorized" as never);
  }

  return user;
}
