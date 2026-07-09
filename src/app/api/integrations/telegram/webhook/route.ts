import { NextResponse, type NextRequest } from "next/server";
import { handleTelegramWebhook, verifyTelegramWebhookSecret } from "@/services/telegram.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!verifyTelegramWebhookSecret(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return NextResponse.json({ error: "Invalid Telegram webhook secret" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const ticket = await handleTelegramWebhook(payload);
  return NextResponse.json({ ok: true, data: ticket }, { status: 202 });
}
