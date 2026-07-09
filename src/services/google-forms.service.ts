import { ApplicationStatus, SyncStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type GoogleFormsWebhookInput = {
  rowId: string;
  submittedAt?: string | Date;
  candidateUsername: string;
  telegramUsername?: string | null;
  telegramId?: string | null;
  discordUsername?: string | null;
  answers: Record<string, unknown>;
};

export function verifyGoogleFormsWebhookToken(token: string | null) {
  const expected = process.env.GOOGLE_FORMS_WEBHOOK_SECRET;
  return Boolean(expected && token && token === expected);
}

export async function upsertApplicationFromGoogleForms(input: GoogleFormsWebhookInput) {
  const startedAt = new Date();
  const submittedAt = input.submittedAt ? new Date(input.submittedAt) : new Date();
  if (Number.isNaN(submittedAt.getTime())) {
    throw new Error("submittedAt must be a valid date when provided.");
  }

  const existing = await prisma.application.findUnique({ where: { googleSheetRowId: input.rowId } });
  const application = await prisma.application.upsert({
    where: { googleSheetRowId: input.rowId },
    create: {
      googleSheetRowId: input.rowId,
      submittedAt,
      candidateUsername: input.candidateUsername,
      telegramUsername: normalizeOptional(input.telegramUsername),
      telegramId: normalizeOptional(input.telegramId),
      discordUsername: normalizeOptional(input.discordUsername),
      answers: toJson(input.answers),
      status: ApplicationStatus.NEW,
    },
    update: {
      submittedAt,
      candidateUsername: input.candidateUsername,
      telegramUsername: normalizeOptional(input.telegramUsername),
      telegramId: normalizeOptional(input.telegramId),
      discordUsername: normalizeOptional(input.discordUsername),
      answers: toJson(input.answers),
    },
  });

  const log = await prisma.integrationSyncLog.create({
    data: {
      integration: "google_forms",
      status: SyncStatus.SUCCESS,
      message: existing ? "Google Forms row updated." : "Google Forms row imported.",
      metadata: { rowId: input.rowId, applicationId: application.id, imported: !existing },
      startedAt,
      finishedAt: new Date(),
    },
  });

  return { application, imported: !existing, log };
}

export async function getLatestGoogleFormsSyncLog() {
  return prisma.integrationSyncLog.findFirst({
    where: { integration: "google_forms" },
    orderBy: { startedAt: "desc" },
  });
}

function normalizeOptional(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function toJson(value: Record<string, unknown>) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
