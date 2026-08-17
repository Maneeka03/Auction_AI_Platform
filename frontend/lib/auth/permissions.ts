import type { PermissionLevel, PermissionModule, Session } from "@/types/auth";

const rank: Record<PermissionLevel, number> = { none: 0, view: 1, full: 2 };

export function can(
  permissions: Session["permissions"],
  module: PermissionModule,
  need: PermissionLevel,
): boolean {
  return rank[permissions[module]] >= rank[need];
}