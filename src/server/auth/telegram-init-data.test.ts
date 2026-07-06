import { describe, expect, it } from "vitest";
import {
  createTelegramInitDataFixture,
  verifyTelegramInitData
} from "./telegram-init-data";

const botToken = "123456:test-token";
const now = new Date("2026-07-06T12:00:00Z");
const authDate = Math.floor(now.getTime() / 1000).toString();
const validUser = {
  id: 42,
  first_name: "Ali",
  last_name: "Saleh",
  username: "ali_qc",
  language_code: "ar"
};

function validFields() {
  return {
    query_id: "AAHdF6IQAAAAAN0XohDhrOrc",
    auth_date: authDate,
    user: JSON.stringify(validUser)
  };
}

describe("verifyTelegramInitData", () => {
  it("accepts valid initData", () => {
    const initData = createTelegramInitDataFixture(validFields(), botToken);
    const result = verifyTelegramInitData(initData, { botToken, now });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.id).toBe(42);
    }
  });

  it("rejects an invalid hash", () => {
    const params = new URLSearchParams(createTelegramInitDataFixture(validFields(), botToken));
    params.set("hash", "0".repeat(64));
    const initData = params.toString();
    const result = verifyTelegramInitData(initData, { botToken, now });

    expect(result).toEqual({ ok: false, reason: "INVALID_HASH" });
  });

  it("rejects stale auth_date", () => {
    const initData = createTelegramInitDataFixture(
      { ...validFields(), auth_date: "1" },
      botToken
    );
    const result = verifyTelegramInitData(initData, { botToken, now });

    expect(result).toEqual({ ok: false, reason: "STALE_AUTH_DATE" });
  });

  it("rejects missing auth_date", () => {
    const fields = validFields();
    delete (fields as Partial<typeof fields>).auth_date;
    const initData = createTelegramInitDataFixture(fields, botToken);
    const result = verifyTelegramInitData(initData, { botToken, now });

    expect(result).toEqual({ ok: false, reason: "MISSING_AUTH_DATE" });
  });

  it("rejects invalid user JSON", () => {
    const initData = createTelegramInitDataFixture(
      { ...validFields(), user: "{bad-json" },
      botToken
    );
    const result = verifyTelegramInitData(initData, { botToken, now });

    expect(result).toEqual({ ok: false, reason: "INVALID_USER" });
  });

  it("rejects initData without hash", () => {
    const result = verifyTelegramInitData(new URLSearchParams(validFields()).toString(), {
      botToken,
      now
    });

    expect(result).toEqual({ ok: false, reason: "MISSING_HASH" });
  });

  it("does not depend on input field order", () => {
    const first = createTelegramInitDataFixture(validFields(), botToken);
    const second = createTelegramInitDataFixture(
      {
        user: JSON.stringify(validUser),
        query_id: "AAHdF6IQAAAAAN0XohDhrOrc",
        auth_date: authDate
      },
      botToken
    );

    expect(verifyTelegramInitData(first, { botToken, now }).ok).toBe(true);
    expect(verifyTelegramInitData(second, { botToken, now }).ok).toBe(true);
  });
});
