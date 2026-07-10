import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { PERMISSIONS, type PermissionKey } from "@/config/permissions";
import { FULL_ACCESS_ROLE_KEYS, isRoleManager } from "@/config/roles";
import { getEffectivePermissionsFromRoles, hasPermission } from "@/lib/permissions";
import { getSessionUser } from "@/lib/session";
import {
  loadUserByTelegramId,
  resolveTelegramLoginUser,
  type DbUserWithRoles,
} from "@/lib/telegram-user-access";
import type { AuthUser, RoleSummary } from "@/types/domain";

export { loadUserByTelegramId, resolveTelegramLoginUser };

const demoUser: AuthUser = {
  id: "demo-owner",
  telegramId: "123456789",
  telegramUsername: "owner",
  displayName: "Owner MAJURE",
  isDemo: true,
  roles: [
    {
      id: "role-developer",
      key: "developer",
      name: "Developer",
      kind: "STAFF_RANK",
      permissions: [...PERMISSIONS],
    },
  ],
  permissions: [...PERMISSIONS],
};

export function toAuthUser(user: NonNullable<DbUserWithRoles>): AuthUser {
  const roles: RoleSummary[] = user.roles
    .filter((userRole) => userRole.active && (!userRole.expiresAt || userRole.expiresAt > new Date()))
    .map((userRole) => ({
      id: userRole.role.id,
      key: userRole.role.key,
      name: userRole.role.name,
      kind: userRole.role.kind,
      permissions: FULL_ACCESS_ROLE_KEYS.includes(userRole.role.key as (typeof FULL_ACCESS_ROLE_KEYS)[number])
        ? [...PERMISSIONS]
        : userRole.role.permissions.map((permission) => permission.key as PermissionKey),
    }));

  return {
    id: user.id,
    telegramId: user.telegramId,
    telegramUsername: user.telegramUsername,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    roles,
    permissions: getEffectivePermissionsFromRoles(roles),
  };
}

export async function getCurrentUser() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  if (sessionUser.isDemo && process.env.NODE_ENV !== "production") return sessionUser;

  const dbUser = await resolveTelegramLoginUser(sessionUser.telegramId);
  if (!dbUser) return null;
  return toAuthUser(dbUser);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireApiPermission(permission: PermissionKey) {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!hasPermission(user.permissions, permission)) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden", permission }, { status: 403 }) };
  }
  return { ok: true as const, user };
}

export async function requireApiRoleManager() {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!isRoleManager(user)) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden", reason: "role_manager_required" }, { status: 403 }) };
  }
  return { ok: true as const, user };
}

export async function requirePagePermission(permission: PermissionKey) {
  const user = await requireUser();
  if (!hasPermission(user.permissions, permission)) redirect("/dashboard");
  return user;
}

export function getDemoUserWithAllPermissions(): AuthUser {
  return {
    ...demoUser,
    permissions: [...PERMISSIONS],
  };
}
