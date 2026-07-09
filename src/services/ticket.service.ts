import { TicketMessageAuthorType, TicketMessageVisibility, TicketPriority, TicketSource, TicketStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export async function listTickets() {
  return prisma.ticket.findMany({
    include: {
      assignedUser: true,
      tags: true,
      messages: {
        include: { authorUser: true, outbound: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getTicket(id: string) {
  return prisma.ticket.findUnique({
    where: { id },
    include: {
      assignedUser: true,
      tags: true,
      messages: { include: { authorUser: true, outbound: true }, orderBy: { createdAt: "asc" } },
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
  externalMessageId?: string;
  attachments?: unknown;
  metadata?: Record<string, unknown>;
}) {
  const ticket = await prisma.ticket.upsert({
    where: { source_externalThreadId: { source: input.source, externalThreadId: input.externalThreadId } },
    create: {
      source: input.source,
      externalThreadId: input.externalThreadId,
      externalUsername: input.externalUsername,
      playerUsername: input.playerUsername,
      title: input.title,
      priority: input.priority ?? TicketPriority.NORMAL,
      status: TicketStatus.NEW,
      metadata: input.metadata === undefined ? undefined : (JSON.parse(JSON.stringify(input.metadata)) as Prisma.InputJsonValue),
    },
    update: {
      externalUsername: input.externalUsername,
      playerUsername: input.playerUsername,
      title: input.title,
      status: TicketStatus.OPEN,
      closedAt: null,
      metadata: input.metadata === undefined ? undefined : (JSON.parse(JSON.stringify(input.metadata)) as Prisma.InputJsonValue),
    },
  });

  if (input.externalMessageId) {
    const duplicate = await prisma.ticketMessage.findFirst({
      where: { ticketId: ticket.id, externalId: input.externalMessageId },
    });
    if (duplicate) return getTicket(ticket.id);
  }

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      authorType: TicketMessageAuthorType.PLAYER,
      body: input.body,
      visibility: TicketMessageVisibility.PUBLIC,
      externalId: input.externalMessageId,
      attachments: input.attachments === undefined ? undefined : (JSON.parse(JSON.stringify(input.attachments)) as Prisma.InputJsonValue),
    },
  });

  return getTicket(ticket.id);
}

export async function replyToTicket(id: string, body: string, actorUserId?: string | null, internal = false) {
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id } });

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.ticketMessage.create({
      data: {
        ticketId: id,
        authorType: TicketMessageAuthorType.ADMIN,
        authorUserId: actorUserId,
        body,
        visibility: internal ? TicketMessageVisibility.INTERNAL : TicketMessageVisibility.PUBLIC,
      },
    });

    if (!internal) {
      await tx.supportOutboundMessage.create({
        data: {
          ticketMessageId: created.id,
          source: ticket.source,
          externalThreadId: ticket.externalThreadId,
          body,
        },
      });
    }

    await tx.ticket.update({
      where: { id },
      data: internal ? {} : { status: TicketStatus.WAITING_PLAYER },
    });

    return created;
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

export async function listTicketAssignees() {
  return prisma.user.findMany({
    where: { active: true },
    orderBy: { displayName: "asc" },
    select: { id: true, displayName: true, telegramUsername: true },
  });
}
