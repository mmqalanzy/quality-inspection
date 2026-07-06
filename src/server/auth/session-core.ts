import crypto from "node:crypto";
import { isUserRole, type UserRole } from "@/domain/roles";

export type SessionPayload = {
  userId: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
};

export type SessionUser = {
  id: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
};

type LoadedSessionUser = Omit<SessionUser, "role"> & {
  role: string;
};

type SessionOptions = {
  secret: string;
  now?: Date;
  ttlSeconds?: number;
  nonce?: string;
};

export const sessionTtlSeconds = 60 * 60 * 12;

export function createSessionToken(userId: string, options: SessionOptions): string {
  const nowSeconds = Math.floor((options.now ?? new Date()).getTime() / 1000);
  const payload: SessionPayload = {
    userId,
    issuedAt: nowSeconds,
    expiresAt: nowSeconds + (options.ttlSeconds ?? sessionTtlSeconds),
    nonce: options.nonce ?? crypto.randomBytes(16).toString("base64url")
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encodedPayload, options.secret);
  return `${encodedPayload}.${signature}`;
}

export function readSessionToken(
  token: string | undefined,
  options: Pick<SessionOptions, "secret" | "now">
): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  if (!timingSafeEqual(signature, sign(encodedPayload, options.secret))) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as SessionPayload;
    const nowSeconds = Math.floor((options.now ?? new Date()).getTime() / 1000);

    if (
      typeof payload.userId !== "string" ||
      typeof payload.expiresAt !== "number" ||
      typeof payload.issuedAt !== "number" ||
      typeof payload.nonce !== "string" ||
      payload.expiresAt <= nowSeconds
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function resolveSessionUser(
  token: string | undefined,
  options: Pick<SessionOptions, "secret" | "now">,
  loadUser: (userId: string) => Promise<LoadedSessionUser | null>
): Promise<SessionUser | null> {
  const payload = readSessionToken(token, options);
  if (!payload) {
    return null;
  }

  const user = await loadUser(payload.userId);
  if (!user?.isActive || !isUserRole(user.role)) {
    return null;
  }

  return {
    ...user,
    role: user.role
  };
}

function sign(value: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function timingSafeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
