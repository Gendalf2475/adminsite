import { ApplicationStatus, StaffStatus, TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DashboardSummary } from "@/types/domain";
import { buildIntegrationStatuses, mapApplicationRow, mapTicketRow } from "@/services/view-models";
import { listAuditLogRows } from "@/services/audit-log.service";
import { hasPermission } from "@/lib/permissions";
import type { PermissionKey } from "@/config/permissions";

export async function getDashboardSummary(permissions: readonly PermissionKey[]): Promise<DashboardSummary> {
  const visibility = {
    staff: hasPermission(permissions, "staff.view"),
    applications: hasPermission(permissions, "applications.view"),
    tickets: hasPermission(permissions, "tickets.view"),
    audit: hasPermission(permissions, "audit.view"),
    integrations: hasPermission(permissions, "integrations.manage"),
  };
  const [
    activeStaff,
    newApplications,
    inWorkApplications,
    openTickets,
    applicationRecords,
    ticketRecords,
    auditRows,
    syncLogs,
  ] = await Promise.all([
    prisma.staffMember.count({ where: { status: StaffStatus.ACTIVE } }),
    prisma.application.count({ where: { status: ApplicationStatus.NEW } }),
    prisma.application.count({ where: { status: { in: [ApplicationStatus.IN_PROGRESS, ApplicationStatus.REVIEW] } } }),
    prisma.ticket.count({ where: { status: { not: TicketStatus.CLOSED } } }),
    prisma.application.findMany({
      include: { assignedReviewer: true, comments: { include: { author: true }, orderBy: { createdAt: "desc" } } },
      orderBy: { submittedAt: "desc" },
      take: 3,
    }),
    prisma.ticket.findMany({
      include: {
        assignedUser: true,
        tags: true,
        messages: { include: { authorUser: true, outbound: true }, orderBy: { createdAt: "asc" } },
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 3,
    }),
    listAuditLogRows(5),
    prisma.integrationSyncLog.findMany({ orderBy: { startedAt: "desc" }, take: 20 }),
  ]);

  return {
    visibility,
    metrics: {
      activeStaff: visibility.staff ? activeStaff : 0,
      newApplications: visibility.applications ? newApplications : 0,
      inWorkApplications: visibility.applications ? inWorkApplications : 0,
      openTickets: visibility.tickets ? openTickets : 0,
    },
    auditRows: visibility.audit ? auditRows : [],
    integrationStatuses: visibility.integrations ? buildIntegrationStatuses(syncLogs) : [],
    applicationRows: visibility.applications ? applicationRecords.map(mapApplicationRow) : [],
    ticketRows: visibility.tickets ? ticketRecords.map(mapTicketRow) : [],
    generatedAt: new Date().toISOString(),
  };
}
