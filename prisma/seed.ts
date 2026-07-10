import { PrismaClient, RoleKind, StaffStatus, ApplicationStatus, TicketPriority, TicketSource, TicketStatus, TicketMessageAuthorType, TicketMessageVisibility, MinecraftServerStatus, SyncStatus } from "@prisma/client";

const prisma = new PrismaClient();

const permissions = [
  ["staff.view", "Просмотр персонала"],
  ["staff.manage", "Управление персоналом"],
  ["staff.change_luckperms_group", "Изменение групп LuckPerms"],
  ["applications.view", "Просмотр заявок"],
  ["applications.manage", "Обработка заявок"],
  ["applications.accept", "Принятие кандидатов"],
  ["applications.reject", "Отклонение кандидатов"],
  ["applications.send_report", "Отметка отчетов кандидатам"],
  ["tickets.view", "Просмотр тикетов"],
  ["tickets.reply", "Ответы игрокам"],
  ["tickets.close", "Закрытие тикетов"],
  ["tickets.assign", "Назначение ответственных"],
  ["settings.view", "Просмотр настроек"],
  ["settings.manage", "Управление настройками"],
  ["audit.view", "Просмотр audit log"],
  ["integrations.manage", "Управление интеграциями"],
] as const;

const roleDefinitions = [
  {
    key: "owner",
    name: "Owner",
    kind: RoleKind.OWNER,
    priority: 1000,
    permissionKeys: permissions.map(([key]) => key),
  },
  {
    key: "curator",
    name: "Curator",
    kind: RoleKind.STAFF_RANK,
    priority: 800,
    permissionKeys: permissions.map(([key]) => key).filter((key) => key !== "settings.manage"),
  },
  {
    key: "senior_admin",
    name: "Senior Admin",
    kind: RoleKind.STAFF_RANK,
    priority: 600,
    permissionKeys: [
      "staff.view",
      "staff.manage",
      "applications.view",
      "applications.manage",
      "applications.accept",
      "applications.reject",
      "tickets.view",
      "tickets.reply",
      "tickets.close",
      "tickets.assign",
      "audit.view",
    ],
  },
  {
    key: "admin",
    name: "Admin",
    kind: RoleKind.STAFF_RANK,
    priority: 400,
    permissionKeys: ["staff.view", "applications.view", "applications.manage", "tickets.view", "tickets.reply", "tickets.assign"],
  },
  {
    key: "moderator",
    name: "Moderator",
    kind: RoleKind.STAFF_RANK,
    priority: 300,
    permissionKeys: ["staff.view", "applications.view", "tickets.view", "tickets.reply"],
  },
  {
    key: "support",
    name: "Support",
    kind: RoleKind.DUTY,
    priority: 250,
    permissionKeys: ["tickets.view", "tickets.reply", "tickets.close", "tickets.assign"],
  },
  {
    key: "viewer",
    name: "Viewer",
    kind: RoleKind.SYSTEM,
    priority: 100,
    permissionKeys: ["staff.view", "applications.view", "tickets.view", "settings.view", "audit.view"],
  },
] as const;

async function main() {
  for (const [key, description] of permissions) {
    await prisma.permission.upsert({
      where: { key },
      create: { key, description },
      update: { description },
    });
  }

  for (const roleDefinition of roleDefinitions) {
    await prisma.role.upsert({
      where: { key: roleDefinition.key },
      create: {
        key: roleDefinition.key,
        name: roleDefinition.name,
        kind: roleDefinition.kind,
        priority: roleDefinition.priority,
        permissions: {
          connect: roleDefinition.permissionKeys.map((key) => ({ key })),
        },
      },
      update: {
        name: roleDefinition.name,
        kind: roleDefinition.kind,
        priority: roleDefinition.priority,
        permissions: {
          set: roleDefinition.permissionKeys.map((key) => ({ key })),
        },
      },
    });
  }

  const ownerTelegramId = process.env.OWNER_TELEGRAM_ID ?? "123456789";
  const ownerUsername = process.env.OWNER_TELEGRAM_USERNAME ?? "owner";

  const ownerStaff = await prisma.staffMember.upsert({
    where: { username: "MajureOwner" },
    create: {
      username: "MajureOwner",
      uuid: "00000000-0000-0000-0000-000000000001",
      telegramId: ownerTelegramId,
      discordUsername: "owner#0001",
      currentLuckPermsGroup: "owner",
      projectPosition: "Владелец проекта",
      status: StaffStatus.ACTIVE,
      notes: "Seed owner account.",
    },
    update: {
      telegramId: ownerTelegramId,
      currentLuckPermsGroup: "owner",
      projectPosition: "Владелец проекта",
      status: StaffStatus.ACTIVE,
    },
  });

  const owner = await prisma.user.upsert({
    where: { telegramId: ownerTelegramId },
    create: {
      telegramId: ownerTelegramId,
      telegramUsername: ownerUsername,
      displayName: "Owner MAJURE",
      active: true,
      staffMemberId: ownerStaff.id,
      roles: {
        create: {
          role: {
            connect: { key: "owner" },
          },
        },
      },
    },
    update: {
      telegramUsername: ownerUsername,
      displayName: "Owner MAJURE",
      active: true,
      staffMemberId: ownerStaff.id,
    },
  });

  const ownerRole = await prisma.role.findUniqueOrThrow({ where: { key: "owner" } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: owner.id, roleId: ownerRole.id } },
    create: { userId: owner.id, roleId: ownerRole.id },
    update: { active: true, expiresAt: null },
  });

  await prisma.staffMember.deleteMany({
    where: { username: { in: ["AstraMajure", "NordKeeper"] } },
  });

  await prisma.application.upsert({
    where: { googleSheetRowId: "row-101" },
    create: {
      googleSheetRowId: "row-101",
      candidateUsername: "QuartzVote",
      telegramUsername: "@quartzvote",
      discordUsername: "quartzvote",
      status: ApplicationStatus.NEW,
      answers: {
        age: "18",
        timezone: "МСК",
        experience: "Модерировал RP-сервер 8 месяцев",
        motivation: "Хочу помогать с политическими конфликтами и правилами войн.",
      },
    },
    update: {},
  });

  await prisma.application.upsert({
    where: { googleSheetRowId: "row-102" },
    create: {
      googleSheetRowId: "row-102",
      candidateUsername: "VelvetLaw",
      telegramUsername: "@velvetlaw",
      discordUsername: "velvetlaw",
      status: ApplicationStatus.IN_PROGRESS,
      assignedReviewerId: owner.id,
      answers: {
        age: "20",
        timezone: "МСК+1",
        experience: "Судья на политическом сервере",
        motivation: "Интересна система законов и апелляций.",
      },
    },
    update: {},
  });

  const ticket = await prisma.ticket.upsert({
    where: { source_externalThreadId: { source: TicketSource.TELEGRAM, externalThreadId: "tg-5001" } },
    create: {
      source: TicketSource.TELEGRAM,
      externalThreadId: "tg-5001",
      playerUsername: "CivicMiner",
      externalUsername: "@civicminer",
      title: "Не выдали роль после вступления",
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.HIGH,
      assignedUserId: owner.id,
      messages: {
        create: [
          {
            authorType: TicketMessageAuthorType.PLAYER,
            body: "Здравствуйте, прошел регистрацию, но роль гражданина не выдалась.",
            visibility: TicketMessageVisibility.PUBLIC,
          },
          {
            authorType: TicketMessageAuthorType.ADMIN,
            authorUserId: owner.id,
            body: "Проверяем синхронизацию с LuckPerms.",
            visibility: TicketMessageVisibility.PUBLIC,
          },
        ],
      },
      tags: {
        create: [{ name: "luckperms", color: "#a855f7" }],
      },
    },
    update: { assignedUserId: owner.id },
  });

  await prisma.minecraftServer.upsert({
    where: { id: "main" },
    create: {
      id: "main",
      name: "MAJURE Main",
      host: "majure.org",
      status: MinecraftServerStatus.ONLINE,
      playersOnline: 128,
      playersMax: 300,
      lastPingAt: new Date(),
      lastPluginSync: new Date(),
    },
    update: {
      status: MinecraftServerStatus.ONLINE,
      playersOnline: 128,
      playersMax: 300,
      lastPingAt: new Date(),
    },
  });

  await prisma.integrationSyncLog.create({
    data: {
      integration: "seed",
      status: SyncStatus.SUCCESS,
      message: `Seed completed. Demo ticket: ${ticket.id}. Demo staff cleanup applied.`,
      finishedAt: new Date(),
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
