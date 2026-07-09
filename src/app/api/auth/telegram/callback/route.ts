import { NextResponse, type NextRequest } from "next/server";
import { verifyTelegramLogin } from "@/lib/telegram-auth";
import { loadUserByTelegramId } from "@/lib/auth";
import { getEffectivePermissionsFromRoles } from "@/lib/permissions";
import { setSessionCookie } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/types/domain";
import type { PermissionKey } from "@/config/permissions";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN is not configured" }, { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const result = verifyTelegramLogin(payload, botToken);
  if (!result.ok) return NextResponse.json({ error: "Telegram login rejected", reason: result.reason }, { status: 401 });

  const dbUser = await loadUserByTelegramId(result.user.id);
  if (!dbUser?.active) return NextResponse.json({ error: "Telegram account is not allowed" }, { status: 403 });

  await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      lastLoginAt: new Date(),
      telegramUsername: result.user.username ?? dbUser.telegramUsername,
      avatarUrl: result.user.photo_url ?? dbUser.avatarUrl,
    },
  });

  const roles = dbUser.roles
    .filter((userRole) => userRole.active && (!userRole.expiresAt || userRole.expiresAt > new Date()))
    .map((userRole) => ({
      id: userRole.role.id,
      key: userRole.role.key,
      name: userRole.role.name,
      kind: userRole.role.kind,
      permissions: userRole.role.permissions.map((permission) => permission.key as PermissionKey),
    }));

  const authUser: AuthUser = {
    id: dbUser.id,
    telegramId: dbUser.telegramId,
    telegramUsername: result.user.username ?? dbUser.telegramUsername,
    displayName: dbUser.displayName,
    avatarUrl: result.user.photo_url ?? dbUser.avatarUrl,
    roles,
    permissions: getEffectivePermissionsFromRoles(roles),
  };

  await setSessionCookie(authUser);
  return NextResponse.json({ ok: true, user: authUser });
}
