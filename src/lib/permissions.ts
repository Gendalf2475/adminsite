import type { RoleSummary } from "@/types/domain";
import type { PermissionKey } from "@/config/permissions";

export function getEffectivePermissionsFromRoles(roles: Array<Pick<RoleSummary, "permissions">>) {
  return Array.from(new Set(roles.flatMap((role) => role.permissions))) as PermissionKey[];
}

export function hasPermission(permissions: readonly string[], required: PermissionKey) {
  return permissions.includes(required);
}

export function hasEveryPermission(permissions: readonly string[], required: PermissionKey[]) {
  return required.every((permission) => hasPermission(permissions, permission));
}

export function assertPermission(permissions: readonly string[], required: PermissionKey) {
  if (!hasPermission(permissions, required)) {
    throw new Error(`Missing permission: ${required}`);
  }
}
