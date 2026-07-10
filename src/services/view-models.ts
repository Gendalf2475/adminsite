import type { Prisma, SyncStatus } from "@prisma/client";
import type { ApplicationRow, AuditLogRow, IntegrationStatus, StaffRow, TicketRow } from "@/types/domain";

type StaffForRow = Prisma.StaffMemberGetPayload<{ include: { assignedBy: true } }>;
type ApplicationForRow = Prisma.ApplicationGetPayload<{
  include: { assignedReviewer: true; comments: { include: { author: true } } };
}>;
type TicketForRow = Prisma.TicketGetPayload<{
  include: {
    assignedUser: true;
    tags: true;
    messages: { include: { authorUser: true; outbound: true } };
  };
}>;
type AuditLogForRow = Prisma.AuditLogGetPayload<{ include: { actor: true } }>;
type SyncLogForStatus = { integration: string; status: SyncStatus; finishedAt: Date | null; startedAt: Date };

const integrationNames: Record<string, string> = {
  google_forms: "Google Forms Webhook",
  telegram_support: "Telegram Support Bot",
  discord_support: "Discord Support Worker",
  minecraft_staff: "Minecraft Staff Sync",
  minecraft_commands: "Minecraft Command Queue",
};

const integrationDescriptions: Record<string, string> = {
  google_forms: "Apps Script отправляет новые заявки в админку по защищенному webhook.",
  telegram_support: "Telegram Bot API принимает обращения игроков и доставляет ответы админов.",
  discord_support: "Sidecar worker слушает Discord DM и доставляет ответы через Gateway.",
  minecraft_staff: "Minecraft plugin синхронизирует персонал через bearer-token endpoint.",
  minecraft_commands: "Плагин забирает очередь команд и возвращает результат выполнения.",
};

const integrationContracts: Record<string, string> = {
  google_forms: "POST /api/integrations/google-forms/webhook",
  telegram_support: "POST /api/integrations/telegram/webhook + Bot API sendMessage",
  discord_support: "support-worker Discord Gateway DM",
  minecraft_staff: "POST /api/integrations/minecraft/sync-staff",
  minecraft_commands: "POST /api/integrations/minecraft/pull-commands + command-result",
};

export function mapStaffRow(staff: StaffForRow): StaffRow {
  return {
    id: staff.id,
    username: staff.username,
    telegramId: staff.telegramId,
    discordUsername: staff.discordUsername,
    currentLuckPermsGroup: staff.currentLuckPermsGroup,
    pendingLuckPermsGroup: staff.pendingLuckPermsGroup,
    projectPosition: staff.projectPosition,
    assignedAt: staff.assignedAt.toISOString(),
    assignedBy: staff.assignedBy?.displayName ?? "System",
    status: staff.status,
    notes: staff.notes ?? undefined,
  };
}

export function mapApplicationRow(application: ApplicationForRow): ApplicationRow {
  return {
    id: application.id,
    googleSheetRowId: application.googleSheetRowId,
    submittedAt: application.submittedAt.toISOString(),
    candidateUsername: application.candidateUsername,
    telegramUsername: application.telegramUsername,
    discordUsername: application.discordUsername,
    status: application.status,
    assignedReviewer: application.assignedReviewer?.displayName ?? null,
    answers: toStringRecord(application.answers),
    comments: application.comments.map((comment) => ({
      id: comment.id,
      author: comment.author?.displayName ?? "System",
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
    })),
  };
}

export function mapTicketRow(ticket: TicketForRow): TicketRow {
  return {
    id: ticket.id,
    source: ticket.source,
    externalThreadId: ticket.externalThreadId,
    playerUsername: ticket.playerUsername ?? undefined,
    externalUsername: ticket.externalUsername,
    title: ticket.title,
    status: ticket.status,
    priority: ticket.priority,
    assignedUser: ticket.assignedUser?.displayName ?? undefined,
    tags: ticket.tags.map((tag) => tag.name),
    createdAt: ticket.createdAt.toISOString(),
    messages: ticket.messages.map((message) => {
      const latestDelivery = [...message.outbound].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      return {
        id: message.id,
        authorType: message.authorType,
        authorName:
          message.authorType === "ADMIN"
            ? message.authorUser?.displayName ?? "Admin"
            : message.authorType === "SYSTEM"
              ? "System"
              : ticket.externalUsername,
        body: message.body,
        visibility: message.visibility,
        createdAt: message.createdAt.toISOString(),
        deliveryStatus: latestDelivery?.status,
        deliveryError: latestDelivery?.errorMessage ?? null,
      };
    }),
  };
}

export function mapAuditLogRow(row: AuditLogForRow): AuditLogRow {
  return {
    id: row.id,
    actor: row.actor?.displayName ?? "System",
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId ?? undefined,
    createdAt: row.createdAt.toISOString(),
    metadata: row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata) ? (row.metadata as Record<string, unknown>) : undefined,
  };
}

export function buildIntegrationStatuses(logs: SyncLogForStatus[]): IntegrationStatus[] {
  const latestByIntegration = new Map<string, SyncLogForStatus>();
  for (const log of logs) {
    const current = latestByIntegration.get(log.integration);
    const currentDate = current?.finishedAt ?? current?.startedAt ?? new Date(0);
    const logDate = log.finishedAt ?? log.startedAt;
    if (!current || logDate > currentDate) latestByIntegration.set(log.integration, log);
  }

  return ["google_forms", "telegram_support", "discord_support", "minecraft_staff", "minecraft_commands"].map((id) => {
    const log = latestByIntegration.get(id);
    return {
      id,
      name: integrationNames[id],
      description: integrationDescriptions[id],
      status: resolveIntegrationStatus(id, log?.status),
      lastSync: (log?.finishedAt ?? log?.startedAt ?? new Date(0)).toISOString(),
      contract: integrationContracts[id],
    };
  });
}

function resolveIntegrationStatus(id: string, lastStatus?: SyncStatus): IntegrationStatus["status"] {
  if (lastStatus === "FAILED") return "offline";
  if (lastStatus === "PARTIAL" || lastStatus === "RUNNING") return "warning";
  if (lastStatus === "SUCCESS") return "online";

  if (id === "telegram_support") return process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_WEBHOOK_SECRET ? "online" : "warning";
  if (id === "discord_support") {
    if (process.env.DISCORD_ENABLED !== "true") return "offline";
    return process.env.DISCORD_BOT_TOKEN ? "online" : "warning";
  }
  if (id === "google_forms") return process.env.GOOGLE_FORMS_WEBHOOK_SECRET ? "online" : "warning";
  if (id.startsWith("minecraft")) return process.env.MINECRAFT_PLUGIN_API_TOKEN ? "online" : "warning";
  return "warning";
}

function toStringRecord(value: Prisma.JsonValue): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      typeof entry === "string" ? entry : JSON.stringify(entry),
    ]),
  );
}
