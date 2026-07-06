export const userRoles = ["INSPECTOR", "QUALITY_ADMIN"] as const;

export type UserRole = (typeof userRoles)[number];

export function isUserRole(value: string): value is UserRole {
  return userRoles.includes(value as UserRole);
}

export function canAccessApp(role: string): boolean {
  return isUserRole(role);
}

export function canAccessAdmin(role: string): boolean {
  return role === "QUALITY_ADMIN";
}
