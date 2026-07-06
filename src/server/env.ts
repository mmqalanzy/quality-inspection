import { z } from "zod";

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().min(1).optional(),
    TELEGRAM_BOT_TOKEN: z.string().min(1),
    TELEGRAM_WEBAPP_URL: z.string().url(),
    TELEGRAM_STORAGE_CHAT_ID: z.string().min(1),
    SESSION_SECRET: z.string().min(16),
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    SUPABASE_SECRET_KEY: z.string().min(1).optional(),
    SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
    MAX_IMAGE_SIZE_MB: z.coerce.number().int().positive().default(8),
    DEV_AUTH_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development")
  })
  .superRefine((env, ctx) => {
    const isProduction = env.NODE_ENV === "production";

    if (isProduction && env.TELEGRAM_BOT_TOKEN.includes("replace-with")) {
      ctx.addIssue({
        code: "custom",
        path: ["TELEGRAM_BOT_TOKEN"],
        message: "TELEGRAM_BOT_TOKEN must be configured in production."
      });
    }

    if (
      isProduction &&
      (env.SESSION_SECRET.includes("placeholder") || env.SESSION_SECRET.length < 32)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["SESSION_SECRET"],
        message: "SESSION_SECRET must be strong in production."
      });
    }
  });

export type ServerEnv = z.infer<typeof envSchema>;

export function getServerEnv(): ServerEnv {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error("Server environment validation failed.");
  }

  return parsed.data;
}

export function isDevelopmentAuthEnabled(env = getServerEnv()): boolean {
  return env.NODE_ENV !== "production" && env.DEV_AUTH_ENABLED;
}

export function getMaxImageSizeBytes(env = getServerEnv()): number {
  return env.MAX_IMAGE_SIZE_MB * 1024 * 1024;
}
