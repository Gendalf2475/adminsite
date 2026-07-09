import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { PERMISSIONS, type PermissionKey } from "@/config/permissions";
import { demoUser } from "@/config/mock-data";
import { prisma } from "@/lib/prisma";
import { getEffectivePermissionsFromRoles, hasPermission } from "@/lib/permissions";
import { getSessionUser } from "@/lib/session";
import type { AuthUser, RoleSummary } from "@/types/domain";

type DbUserWithRoles = Awaited<ReturnType<typeof loadUserByTelegramId>>;

function toAuthUser(user: NonNullable<DbUserWithRoles>): AuthUser {
  const roles: RoleSummary[] = user.roles
    .filter((userRole) => userRole.active && (!userRole.expiresAt || userRole.expiresAt > new Date()))
    .map((userRole) => ({
      id: userRole.role.id,
      key: userRole.role.key,
      name: userRole.role.name,
      kind: userRole.role.kind,
      permissions: userRole.role.permissions.map((permission) => permission.key as PermissionKey),
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

export async function loadUserByTelegramId(telegramId: string) {
  return prisma.user.findUnique({
    where: { telegramId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      },
    },
  });
}

export async function getCurrentUser() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  if (sessionUser.isDemo && process.env.NODE_ENV !== "production") return sessionUser;

  const dbUser = await loadUserByTelegramId(sessionUser.telegramId);
  if (!dbUser?.active) return null;
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

export function getDemoUserWithAllPermissions(): AuthUser {
  return {
    ...demoUser,
    permissions: [...PERMISSIONS],
  };
}
