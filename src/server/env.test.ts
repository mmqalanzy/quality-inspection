import { describe, expect, it } from "vitest";
import { isDevelopmentAuthEnabled, type ServerEnv } from "./env";

function env(overrides: Partial<ServerEnv>): ServerEnv {
  return {
    DATABASE_URL: "postgresql://postgres:password@localhost:5432/postgres",
    TELEGRAM_BOT_TOKEN: "replace-with-bot-token",
    TELEGRAM_WEBAPP_URL: "https://example.com",
    TELEGRAM_STORAGE_CHAT_ID: "-1001234567890",
    SESSION_SECRET: "development-placeholder-change-me",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SECRET_KEY: "sb_secret_test_key",
    MAX_IMAGE_SIZE_MB: 8,
    DEV_AUTH_ENABLED: true,
    NODE_ENV: "development",
    ...overrides
  };
}

describe("development authentication flag", () => {
  it("works only when enabled outside production", () => {
    expect(isDevelopmentAuthEnabled(env({ DEV_AUTH_ENABLED: true }))).toBe(true);
  });

  it("is disabled when DEV_AUTH_ENABLED is false", () => {
    expect(isDevelopmentAuthEnabled(env({ DEV_AUTH_ENABLED: false }))).toBe(false);
  });

  it("is disabled in production", () => {
    expect(
      isDevelopmentAuthEnabled(
        env({
          DEV_AUTH_ENABLED: true,
          NODE_ENV: "production",
          TELEGRAM_BOT_TOKEN: "123456:production-token",
          SESSION_SECRET: "a-production-secret-with-enough-entropy"
        })
      )
    ).toBe(false);
  });
});
