import { NextResponse, type NextRequest } from "next/server";
import { verifyTelegramLogin } from "@/lib/telegram-auth";
import { resolveTelegramLoginUser, toAuthUser } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/types/domain";

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

  const dbUser = await resolveTelegramLoginUser(result.user.id);
  if (!dbUser) return NextResponse.json({ error: "Telegram account is not allowed" }, { status: 403 });

  await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      lastLoginAt: new Date(),
      telegramUsername: result.user.username ?? dbUser.telegramUsername,
      avatarUrl: result.user.photo_url ?? dbUser.avatarUrl,
    },
  });

  const authUser: AuthUser = {
    ...toAuthUser(dbUser),
    telegramUsername: result.user.username ?? dbUser.telegramUsername,
    avatarUrl: result.user.photo_url ?? dbUser.avatarUrl,
  };

  await setSessionCookie(authUser);
  return NextResponse.json({ ok: true, user: authUser });
}
