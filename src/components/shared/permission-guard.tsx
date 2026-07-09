import { hasPermission } from "@/lib/permissions";
import type { PermissionKey } from "@/config/permissions";

export function PermissionGuard({
  permissions,
  require,
  children,
  fallback = null,
}: {
  permissions: readonly string[];
  require: PermissionKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  if (!hasPermission(permissions, require)) return fallback;
  return children;
}
