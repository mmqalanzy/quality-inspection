import { describe, expect, it } from "vitest";
import { authorizePath } from "./authorization";

describe("authorization", () => {
  it("allows inspectors into app pages", () => {
    expect(authorizePath("INSPECTOR", "/app")).toBe("ALLOW");
  });

  it("rejects inspectors from admin pages", () => {
    expect(authorizePath("INSPECTOR", "/admin")).toBe("FORBIDDEN");
  });

  it("allows quality admins into admin pages", () => {
    expect(authorizePath("QUALITY_ADMIN", "/admin")).toBe("ALLOW");
  });

  it("redirects unauthenticated users to login", () => {
    expect(authorizePath(null, "/app")).toBe("LOGIN_REQUIRED");
  });

  it("rejects unknown roles from protected pages", () => {
    expect(authorizePath("OWNER", "/app")).toBe("FORBIDDEN");
  });
});
