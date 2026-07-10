import type { Prisma } from "@prisma/client";
import { auditEntityTypeLabels, getAuditActionLabel } from "@/config/audit";
import { prisma } from "@/lib/prisma";
import type { AuditLogRow } from "@/types/domain";

type AuditRecord = Prisma.AuditLogGetPayload<{ include: { actor: { include: { staffMember: true } } } }>;

export async function listAuditLogRows(take = 100): Promise<AuditLogRow[]> {
  const records = await prisma.auditLog.findMany({
    include: { actor: { include: { staffMember: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
  const commandIds = entityIds(records, "MinecraftCommandQueue");
  const commands = commandIds.length > 0
    ? await prisma.minecraftCommandQueue.findMany({
        where: { id: { in: commandIds } },
        select: { id: true, staffMemberId: true, payload: true },
      })
    : [];
  const commandById = new Map(commands.map((command) => [command.id, command]));
  const staffIds = new Set(entityIds(records, "StaffMember"));
  commands.forEach((command) => {
    if (command.staffMemberId) staffIds.add(command.staffMemberId);
  });

  const [staff, applications, tickets, roles] = await Promise.all([
    staffIds.size > 0
      ? prisma.staffMember.findMany({ where: { id: { in: [...staffIds] } }, select: { id: true, username: true } })
      : [],
    findApplications(entityIds(records, "Application")),
    findTickets(entityIds(records, "Ticket")),
    findRoles(entityIds(records, "Role")),
  ]);
  const staffById = new Map(staff.map((item) => [item.id, item.username]));
  const applicationById = new Map(applications.map((item) => [item.id, item.candidateUsername]));
  const ticketById = new Map(tickets.map((item) => [item.id, item.playerUsername ?? item.externalUsername]));
  const roleById = new Map(roles.map((item) => [item.id, item.name]));

  return records.map((record) => {
    const metadata = asRecord(record.metadata);
    return {
      id: record.id,
      actor: record.actor?.staffMember?.username ?? record.actor?.telegramUsername ?? record.actor?.displayName ?? "Система",
      action: getAuditActionLabel(record.action, metadata),
      entityType: auditEntityTypeLabels[record.entityType] ?? "Объект",
      entity: resolveEntityLabel(record, { staffById, applicationById, ticketById, roleById, commandById }),
      createdAt: record.createdAt.toISOString(),
      metadata: metadata ?? undefined,
    };
  });
}

function resolveEntityLabel(
  record: AuditRecord,
  lookup: {
    staffById: Map<string, string>;
    applicationById: Map<string, string>;
    ticketById: Map<string, string>;
    roleById: Map<string, string>;
    commandById: Map<string, { staffMemberId: string | null; payload: Prisma.JsonValue }>;
  },
) {
  if (!record.entityId) return "Без названия";
  if (record.entityType === "StaffMember") {
    return lookup.staffById.get(record.entityId) ?? jsonString(record.newValue, "username") ?? jsonString(record.oldValue, "username") ?? "Удалённый сотрудник";
  }
  if (record.entityType === "Application") return lookup.applicationById.get(record.entityId) ?? "Удалённая заявка";
  if (record.entityType === "Ticket") return lookup.ticketById.get(record.entityId) ?? "Удалённый тикет";
  if (record.entityType === "Role") return lookup.roleById.get(record.entityId) ?? "Удалённая роль";
  if (record.entityType === "MinecraftCommandQueue") {
    const command = lookup.commandById.get(record.entityId);
    return (command?.staffMemberId ? lookup.staffById.get(command.staffMemberId) : null) ?? jsonString(command?.payload, "username") ?? "Серверная команда";
  }
  return "Объект";
}

function entityIds(records: AuditRecord[], entityType: string) {
  return records.filter((record) => record.entityType === entityType && record.entityId).map((record) => record.entityId as string);
}

function findApplications(ids: string[]) {
  return ids.length > 0
    ? prisma.application.findMany({ where: { id: { in: ids } }, select: { id: true, candidateUsername: true } })
    : Promise.resolve([]);
}

function findTickets(ids: string[]) {
  return ids.length > 0
    ? prisma.ticket.findMany({ where: { id: { in: ids } }, select: { id: true, playerUsername: true, externalUsername: true } })
    : Promise.resolve([]);
}

function findRoles(ids: string[]) {
  return ids.length > 0
    ? prisma.role.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
    : Promise.resolve([]);
}

function asRecord(value: Prisma.JsonValue | null) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function jsonString(value: Prisma.JsonValue | undefined | null, key: string) {
  const record = asRecord(value ?? null);
  return typeof record?.[key] === "string" ? record[key] : null;
}
