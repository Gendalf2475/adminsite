import { ApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export async function listApplications() {
  return prisma.application.findMany({
    include: { assignedReviewer: true, comments: { include: { author: true }, orderBy: { createdAt: "desc" } } },
    orderBy: { submittedAt: "desc" },
  });
}

export async function getApplication(id: string) {
  return prisma.application.findUnique({
    where: { id },
    include: {
      assignedReviewer: true,
      comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus, actorUserId?: string | null, note?: string) {
  const before = await prisma.application.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.application.update({
    where: { id },
    data: {
      status,
      statusHistory: {
        create: {
          fromStatus: before.status,
          toStatus: status,
          actorUserId,
          note,
        },
      },
    },
  });

  await writeAuditLog({
    actorUserId,
    action: "application.status_changed",
    entityType: "Application",
    entityId: id,
    oldValue: { status: before.status },
    newValue: { status },
  });

  return updated;
}

export async function addApplicationComment(id: string, body: string, actorUserId?: string | null) {
  const comment = await prisma.applicationComment.create({
    data: {
      applicationId: id,
      authorUserId: actorUserId,
      body,
      internal: true,
    },
  });

  await writeAuditLog({
    actorUserId,
    action: "application.comment.created",
    entityType: "Application",
    entityId: id,
    newValue: { commentId: comment.id },
  });

  return comment;
}

export async function assignApplication(id: string, reviewerId: string | null, actorUserId?: string | null) {
  const updated = await prisma.application.update({
    where: { id },
    data: { assignedReviewerId: reviewerId },
  });

  await writeAuditLog({
    actorUserId,
    action: "application.assigned",
    entityType: "Application",
    entityId: id,
    newValue: { reviewerId },
  });

  return updated;
}

export async function sendApplicationReport(id: string, actorUserId?: string | null) {
  await addApplicationComment(id, "Отчет отмечен как отправленный через контактный канал кандидата.", actorUserId);
  return updateApplicationStatus(id, ApplicationStatus.REPORT_SENT, actorUserId, "Report marked as sent from admin panel.");
}
