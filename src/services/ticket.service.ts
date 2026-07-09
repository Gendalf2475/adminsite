import { TicketMessageAuthorType, TicketMessageVisibility, TicketPriority, TicketSource, TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export async function listTickets() {
  return prisma.ticket.findMany({
    include: { assignedUser: true, tags: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getTicket(id: string) {
  return prisma.ticket.findUnique({
    where: { id },
    include: {
      assignedUser: true,
      tags: true,
      messages: { include: { authorUser: true }, orderBy: { createdAt: "asc" } },
      assignments: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}

export async function createTicketFromExternal(input: {
  source: TicketSource;
  externalThreadId: string;
  externalUsername: string;
  playerUsername?: string;
  title: string;
  body: string;
  priority?: TicketPriority;
}) {
  return prisma.ticket.upsert({
    where: { source_externalThreadId: { source: input.source, externalThreadId: input.externalThreadId } },
    create: {
      source: input.source,
      externalThreadId: input.externalThreadId,
      externalUsername: input.externalUsername,
      playerUsername: input.playerUsername,
      title: input.title,
      priority: input.priority ?? TicketPriority.NORMAL,
      status: TicketStatus.NEW,
      messages: {
        create: {
          authorType: TicketMessageAuthorType.PLAYER,
          body: input.body,
          visibility: TicketMessageVisibility.PUBLIC,
        },
      },
    },
    update: {
      messages: {
        create: {
          authorType: TicketMessageAuthorType.PLAYER,
          body: input.body,
          visibility: TicketMessageVisibility.PUBLIC,
        },
      },
      status: TicketStatus.OPEN,
    },
  });
}

export async function replyToTicket(id: string, body: string, actorUserId?: string | null, internal = false) {
  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: id,
      authorType: TicketMessageAuthorType.ADMIN,
      authorUserId: actorUserId,
      body,
      visibility: internal ? TicketMessageVisibility.INTERNAL : TicketMessageVisibility.PUBLIC,
    },
  });

  await prisma.ticket.update({
    where: { id },
    data: { status: internal ? undefined : TicketStatus.WAITING_PLAYER },
  });

  await writeAuditLog({
    actorUserId,
    action: internal ? "ticket.internal_note.created" : "ticket.reply.sent",
    entityType: "Ticket",
    entityId: id,
    newValue: { messageId: message.id },
  });

  return message;
}

export async function updateTicketStatus(id: string, status: TicketStatus, actorUserId?: string | null) {
  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      status,
      closedAt: status === TicketStatus.CLOSED ? new Date() : null,
    },
  });

  await writeAuditLog({
    actorUserId,
    action: "ticket.status_changed",
    entityType: "Ticket",
    entityId: id,
    newValue: { status },
  });

  return ticket;
}

export async function assignTicket(id: string, assignedUserId: string | null, actorUserId?: string | null) {
  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      assignedUserId,
      assignments: {
        create: {
          assignedUserId,
          actorUserId,
        },
      },
    },
  });

  await writeAuditLog({
    actorUserId,
    action: "ticket.assigned",
    entityType: "Ticket",
    entityId: id,
    newValue: { assignedUserId },
  });

  return ticket;
}
