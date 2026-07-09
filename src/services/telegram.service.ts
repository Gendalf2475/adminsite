import { TicketSource } from "@prisma/client";
import { createTicketFromExternal } from "@/services/ticket.service";

export async function handleTelegramWebhookMock(payload: {
  message?: {
    message_id?: number;
    text?: string;
    chat?: { id?: number | string; username?: string };
    from?: { username?: string };
  };
}) {
  const chatId = String(payload.message?.chat?.id ?? payload.message?.message_id ?? Date.now());
  const username = payload.message?.from?.username ?? payload.message?.chat?.username ?? "telegram_user";
  const body = payload.message?.text ?? "Mock Telegram support message";

  return createTicketFromExternal({
    source: TicketSource.TELEGRAM,
    externalThreadId: `tg-${chatId}`,
    externalUsername: `@${username}`,
    title: body.slice(0, 64),
    body,
  });
}

export async function sendTelegramReplyMock(input: { externalThreadId: string; body: string }) {
  return {
    ok: true,
    provider: "telegram",
    externalThreadId: input.externalThreadId,
    body: input.body,
    sentAt: new Date().toISOString(),
  };
}
