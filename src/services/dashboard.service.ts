import { ApplicationStatus, StaffStatus, TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DashboardSummary } from "@/types/domain";
import { buildIntegrationStatuses, mapApplicationRow, mapAuditLogRow, mapTicketRow } from "@/services/view-models";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [
    activeStaff,
    newApplications,
    inWorkApplications,
    openTickets,
    applicationRecords,
    ticketRecords,
    auditRecords,
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
    prisma.auditLog.findMany({ include: { actor: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.integrationSyncLog.findMany({ orderBy: { startedAt: "desc" }, take: 20 }),
  ]);

  return {
    metrics: {
      activeStaff,
      newApplications,
      inWorkApplications,
      openTickets,
    },
    auditRows: auditRecords.map(mapAuditLogRow),
    integrationStatuses: buildIntegrationStatuses(syncLogs),
    applicationRows: applicationRecords.map(mapApplicationRow),
    ticketRows: ticketRecords.map(mapTicketRow),
    generatedAt: new Date().toISOString(),
  };
}
