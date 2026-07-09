import { TicketSource } from "@prisma/client";
import { createTicketFromExternal } from "@/services/ticket.service";

export async function handleDiscordWebhookMock(payload: {
  id?: string;
  content?: string;
  author?: { username?: string };
  channel_id?: string;
}) {
  const threadId = payload.channel_id ?? payload.id ?? String(Date.now());
  const username = payload.author?.username ?? "discord_user";
  const body = payload.content ?? "Mock Discord support message";

  return createTicketFromExternal({
    source: TicketSource.DISCORD,
    externalThreadId: `dc-${threadId}`,
    externalUsername: username,
    title: body.slice(0, 64),
    body,
  });
}

export async function sendDiscordReplyMock(input: { externalThreadId: string; body: string }) {
  return {
    ok: true,
    provider: "discord",
    externalThreadId: input.externalThreadId,
    body: input.body,
    sentAt: new Date().toISOString(),
  };
}
