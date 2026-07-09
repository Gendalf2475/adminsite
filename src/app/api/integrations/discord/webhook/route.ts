import { NextResponse, type NextRequest } from "next/server";
import { handleDiscordWebhookMock } from "@/services/discord.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));
  const ticket = await handleDiscordWebhookMock(payload);
  return NextResponse.json({ ok: true, data: ticket }, { status: 202 });
}
