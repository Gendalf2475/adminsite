import { SyncStatus, TicketSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createTicketFromExternal } from "@/services/ticket.service";

export type DiscordDirectMessageInput = {
  userId: string;
  username: string;
  displayName?: string | null;
  messageId?: string;
  body: string;
  attachments?: Array<{ id: string; url: string; name?: string | null; contentType?: string | null }>;
};

export async function handleDiscordDirectMessage(input: DiscordDirectMessageInput) {
  const startedAt = new Date();
  const externalUsername = input.username ? `@${input.username}` : input.displayName || `discord:${input.userId}`;
  const body = input.body.trim() || "[Discord attachment]";

  const ticket = await createTicketFromExternal({
    source: TicketSource.DISCORD,
    externalThreadId: input.userId,
    externalUsername,
    title: body.slice(0, 80),
    body,
    externalMessageId: input.messageId,
    attachments: input.attachments?.length ? input.attachments : undefined,
    metadata: {
      userId: input.userId,
      displayName: input.displayName ?? null,
    },
  });

  await prisma.integrationSyncLog.create({
    data: {
      integration: "discord_support",
      status: SyncStatus.SUCCESS,
      message: "Discord DM accepted.",
      metadata: { userId: input.userId, ticketId: ticket?.id ?? null },
      startedAt,
      finishedAt: new Date(),
    },
  });

  return ticket;
}
