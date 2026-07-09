import { OutboundDeliveryStatus, TicketSource, type SupportOutboundMessage } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const retryScheduleSeconds = [5, 30, 120, 300];
const maxAttempts = 8;

export type ClaimedOutboundMessage = SupportOutboundMessage;

export async function claimDueOutboundMessages(limit = 25) {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - 1000 * 60 * 10);

  const due = await prisma.supportOutboundMessage.findMany({
    where: {
      OR: [
        {
          status: OutboundDeliveryStatus.PENDING,
          nextAttemptAt: { lte: now },
          attempts: { lt: maxAttempts },
        },
        {
          status: OutboundDeliveryStatus.PROCESSING,
          lockedAt: { lt: staleBefore },
          attempts: { lt: maxAttempts },
        },
      ],
    },
    orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
    take: limit,
  });

  if (due.length === 0) return [];

  const ids = due.map((message) => message.id);
  await prisma.supportOutboundMessage.updateMany({
    where: { id: { in: ids } },
    data: {
      status: OutboundDeliveryStatus.PROCESSING,
      lockedAt: now,
      attempts: { increment: 1 },
      errorMessage: null,
    },
  });

  return prisma.supportOutboundMessage.findMany({
    where: { id: { in: ids } },
    orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
  });
}

export async function markOutboundSent(id: string) {
  return prisma.supportOutboundMessage.update({
    where: { id },
    data: {
      status: OutboundDeliveryStatus.SENT,
      sentAt: new Date(),
      lockedAt: null,
      errorMessage: null,
    },
  });
}

export async function markOutboundFailed(id: string, errorMessage: string) {
  const message = await prisma.supportOutboundMessage.findUniqueOrThrow({ where: { id } });
  const finalFailure = isFinalOutboundFailure(message.attempts);
  const delay = getOutboundRetryDelaySeconds(message.attempts);

  return prisma.supportOutboundMessage.update({
    where: { id },
    data: {
      status: finalFailure ? OutboundDeliveryStatus.FAILED : OutboundDeliveryStatus.PENDING,
      lockedAt: null,
      nextAttemptAt: finalFailure ? message.nextAttemptAt : new Date(Date.now() + delay * 1000),
      errorMessage: errorMessage.slice(0, 2000),
    },
  });
}

export function isSupportedOutboundSource(source: TicketSource) {
  return source === TicketSource.TELEGRAM || source === TicketSource.DISCORD;
}

export function getOutboundRetryDelaySeconds(attempts: number) {
  return retryScheduleSeconds[Math.min(Math.max(attempts - 1, 0), retryScheduleSeconds.length - 1)];
}

export function isFinalOutboundFailure(attempts: number) {
  return attempts >= maxAttempts;
}
