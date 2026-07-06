import { canAccessAdmin, canAccessApp } from "@/domain/roles";

export type AuthorizationDecision = "ALLOW" | "LOGIN_REQUIRED" | "FORBIDDEN";

export function authorizePath(role: string | null, pathname: string): AuthorizationDecision {
  if (!role) {
    return "LOGIN_REQUIRED";
  }

  if (pathname.startsWith("/admin")) {
    return canAccessAdmin(role) ? "ALLOW" : "FORBIDDEN";
  }

  if (pathname.startsWith("/app")) {
    return canAccessApp(role) ? "ALLOW" : "FORBIDDEN";
  }

  return "ALLOW";
}
