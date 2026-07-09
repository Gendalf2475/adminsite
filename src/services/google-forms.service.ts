import { ApplicationStatus, SyncStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const mockRows = [
  {
    googleSheetRowId: "mock-sheet-201",
    candidateUsername: "QuartzVote",
    telegramUsername: "@quartzvote",
    discordUsername: "quartzvote",
    answers: {
      "Возраст": "18",
      "Опыт": "Модерировал RP-сервер 8 месяцев",
      "Почему MAJURE": "Хочу помогать с политическими конфликтами.",
    },
  },
  {
    googleSheetRowId: "mock-sheet-202",
    candidateUsername: "IronDeputy",
    telegramUsername: "@irondeputy",
    discordUsername: "irondeputy",
    answers: {
      "Возраст": "19",
      "Опыт": "Помогал с Discord-поддержкой",
      "Почему MAJURE": "Нравится политическая модель сервера.",
    },
  },
];

export async function syncApplicationsFromGoogleSheetsMock() {
  const startedAt = new Date();
  let imported = 0;

  for (const row of mockRows) {
    const existing = await prisma.application.findUnique({ where: { googleSheetRowId: row.googleSheetRowId } });
    await prisma.application.upsert({
      where: { googleSheetRowId: row.googleSheetRowId },
      create: {
        ...row,
        status: ApplicationStatus.NEW,
      },
      update: {
        telegramUsername: row.telegramUsername,
        discordUsername: row.discordUsername,
        answers: row.answers,
      },
    });
    if (!existing) imported += 1;
  }

  const log = await prisma.integrationSyncLog.create({
    data: {
      integration: "google_forms",
      status: SyncStatus.SUCCESS,
      message: `Mock sync completed: ${imported} new applications.`,
      metadata: { imported, total: mockRows.length },
      startedAt,
      finishedAt: new Date(),
    },
  });

  return { imported, total: mockRows.length, log };
}
