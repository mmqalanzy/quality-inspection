import crypto from "node:crypto";
import { z } from "zod";

const telegramUserSchema = z.object({
  id: z.number().int().positive(),
  first_name: z.string().min(1),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional(),
  photo_url: z.string().url().optional()
});

export type TelegramVerifiedUser = z.infer<typeof telegramUserSchema>;

export type TelegramInitDataResult =
  | {
      ok: true;
      user: TelegramVerifiedUser;
      authDate: Date;
    }
  | {
      ok: false;
      reason:
        | "MISSING_HASH"
        | "INVALID_HASH"
        | "MISSING_AUTH_DATE"
        | "STALE_AUTH_DATE"
        | "INVALID_AUTH_DATE"
        | "MISSING_USER"
        | "INVALID_USER";
    };

type VerifyOptions = {
  botToken: string;
  maxAgeSeconds?: number;
  now?: Date;
};

export function verifyTelegramInitData(
  initData: string,
  options: VerifyOptions
): TelegramInitDataResult {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    return { ok: false, reason: "MISSING_HASH" };
  }

  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(options.botToken)
    .digest();
  const expectedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (!timingSafeHexEqual(hash, expectedHash)) {
    return { ok: false, reason: "INVALID_HASH" };
  }

  const authDateValue = params.get("auth_date");
  if (!authDateValue) {
    return { ok: false, reason: "MISSING_AUTH_DATE" };
  }

  const authDateSeconds = Number(authDateValue);
  if (!Number.isInteger(authDateSeconds) || authDateSeconds <= 0) {
    return { ok: false, reason: "INVALID_AUTH_DATE" };
  }

  const nowSeconds = Math.floor((options.now ?? new Date()).getTime() / 1000);
  const maxAgeSeconds = options.maxAgeSeconds ?? 60 * 60 * 24;
  if (nowSeconds - authDateSeconds > maxAgeSeconds) {
    return { ok: false, reason: "STALE_AUTH_DATE" };
  }

  const userValue = params.get("user");
  if (!userValue) {
    return { ok: false, reason: "MISSING_USER" };
  }

  try {
    const user = telegramUserSchema.parse(JSON.parse(userValue));
    return { ok: true, user, authDate: new Date(authDateSeconds * 1000) };
  } catch {
    return { ok: false, reason: "INVALID_USER" };
  }
}

export function createTelegramInitDataFixture(
  fields: Record<string, string>,
  botToken: string
): string {
  const params = new URLSearchParams(fields);
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  params.set("hash", hash);
  return params.toString();
}

function timingSafeHexEqual(left: string, right: string): boolean {
  if (!/^[a-f0-9]+$/i.test(left) || !/^[a-f0-9]+$/i.test(right)) {
    return false;
  }

  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
