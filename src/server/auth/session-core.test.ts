import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  readSessionToken,
  resolveSessionUser,
} from "./session-core";

const secret = "test-secret-with-enough-length";
const now = new Date("2026-07-06T12:00:00Z");

describe("session tokens", () => {
  it("creates and reads a session", () => {
    const token = createSessionToken("user-1", {
      secret,
      now,
      nonce: "fixed"
    });

    expect(readSessionToken(token, { secret, now })?.userId).toBe("user-1");
  });

  it("rejects a tampered session", () => {
    const token = createSessionToken("user-1", { secret, now, nonce: "fixed" });
    const [payload, signature] = token.split(".");
    const tampered = `${payload.slice(0, -1)}x.${signature}`;

    expect(readSessionToken(tampered, { secret, now })).toBeNull();
  });

  it("rejects an expired session", () => {
    const token = createSessionToken("user-1", {
      secret,
      now,
      ttlSeconds: 1,
      nonce: "fixed"
    });

    expect(
      readSessionToken(token, {
        secret,
        now: new Date("2026-07-06T12:00:02Z")
      })
    ).toBeNull();
  });

  it("rejects an inactive user", async () => {
    const token = createSessionToken("user-1", { secret, now, nonce: "fixed" });
    const user = await resolveSessionUser(token, { secret, now }, async () => ({
      id: "user-1",
      fullName: "Inactive",
      role: "INSPECTOR",
      isActive: false
    }));

    expect(user).toBeNull();
  });

  it("rejects an unknown role", async () => {
    const token = createSessionToken("user-1", { secret, now, nonce: "fixed" });
    const user = await resolveSessionUser(
      token,
      { secret, now },
      async () =>
        ({
          id: "user-1",
          fullName: "Unknown",
          role: "OWNER",
          isActive: true
        })
    );

    expect(user).toBeNull();
  });
});
