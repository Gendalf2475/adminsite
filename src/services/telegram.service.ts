import { SyncStatus, TicketSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createTicketFromExternal } from "@/services/ticket.service";

type TelegramUpdate = {
  update_id?: number;
  message?: {
    message_id?: number;
    text?: string;
    caption?: string;
    chat?: { id?: number | string; username?: string; first_name?: string; last_name?: string };
    from?: { id?: number | string; username?: string; first_name?: string; last_name?: string };
    photo?: unknown[];
    document?: unknown;
    video?: unknown;
  };
};

export function verifyTelegramWebhookSecret(secret: string | null) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  return Boolean(expected && secret && expected === secret);
}

export async function handleTelegramWebhook(payload: TelegramUpdate) {
  const startedAt = new Date();
  const message = payload.message;
  if (!message?.chat?.id) {
    await writeTelegramLog(SyncStatus.PARTIAL, "Telegram update ignored: no message chat id.", startedAt, payload);
    return null;
  }

  const chatId = String(message.chat.id);
  const username = message.from?.username ?? message.chat.username;
  const displayName = [message.from?.first_name ?? message.chat.first_name, message.from?.last_name ?? message.chat.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const body = (message.text ?? message.caption ?? "").trim() || "[Telegram attachment]";
  const attachments = collectTelegramAttachments(message);

  const ticket = await createTicketFromExternal({
    source: TicketSource.TELEGRAM,
    externalThreadId: chatId,
    externalUsername: username ? `@${username}` : displayName || `tg:${chatId}`,
    title: body.slice(0, 80),
    body,
    externalMessageId: message.message_id ? String(message.message_id) : payload.update_id ? String(payload.update_id) : undefined,
    attachments: attachments.length > 0 ? attachments : undefined,
    metadata: {
      chatId,
      fromId: message.from?.id ? String(message.from.id) : null,
      updateId: payload.update_id ?? null,
    },
  });

  await writeTelegramLog(SyncStatus.SUCCESS, "Telegram support update accepted.", startedAt, {
    chatId,
    ticketId: ticket?.id ?? null,
  });

  return ticket;
}

export async function sendTelegramReply(input: { externalThreadId: string; body: string }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured.");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: input.externalThreadId,
      text: input.body,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Telegram sendMessage failed: HTTP ${response.status} ${text.slice(0, 300)}`);
  }

  return response.json() as Promise<unknown>;
}

function collectTelegramAttachments(message: NonNullable<TelegramUpdate["message"]>) {
  const attachments: Array<Record<string, unknown>> = [];
  if (message.photo?.length) attachments.push({ type: "photo", items: message.photo });
  if (message.document) attachments.push({ type: "document", item: message.document });
  if (message.video) attachments.push({ type: "video", item: message.video });
  return attachments;
}

async function writeTelegramLog(status: SyncStatus, message: string, startedAt: Date, metadata: unknown) {
  return prisma.integrationSyncLog.create({
    data: {
      integration: "telegram_support",
      status,
      message,
      metadata: JSON.parse(JSON.stringify(metadata)),
      startedAt,
      finishedAt: new Date(),
    },
  });
}
