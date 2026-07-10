import { StaffStatus, SyncStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { queueLuckPermsGroupChange } from "@/services/luckperms.service";

export async function listStaff() {
  return prisma.staffMember.findMany({
    include: { assignedBy: true },
    orderBy: [{ status: "asc" }, { assignedAt: "desc" }],
  });
}

export async function getStaffMember(id: string) {
  return prisma.staffMember.findUnique({
    where: { id },
    include: { assignedBy: true, history: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
}

export async function createStaffMember(input: {
  username: string;
  uuid?: string;
  telegramId?: string;
  discordUsername?: string;
  currentLuckPermsGroup: string;
  projectPosition: string;
  assignedById?: string | null;
}) {
  const staff = await prisma.staffMember.create({
    data: {
      username: input.username,
      uuid: input.uuid,
      telegramId: input.telegramId,
      discordUsername: input.discordUsername,
      currentLuckPermsGroup: input.currentLuckPermsGroup,
      pendingLuckPermsGroup: input.currentLuckPermsGroup,
      projectPosition: input.projectPosition,
      assignedById: input.assignedById,
      status: StaffStatus.PROBATION,
    },
  });

  const command = await queueLuckPermsGroupChange({
    staffMemberId: staff.id,
    username: staff.username,
    uuid: staff.uuid,
    group: input.currentLuckPermsGroup,
    requestedById: input.assignedById,
  });

  await prisma.staffHistory.create({
    data: {
      staffMemberId: staff.id,
      actorUserId: input.assignedById,
      action: "staff.created_luckperms_group.queued",
      newValue: { pendingLuckPermsGroup: input.currentLuckPermsGroup, commandId: command.id },
    },
  });

  await writeAuditLog({
    actorUserId: input.assignedById,
    action: "staff.created",
    entityType: "StaffMember",
    entityId: staff.id,
    newValue: staff,
  });

  return staff;
}

export async function updateStaffMember(
  id: string,
  input: Partial<{ projectPosition: string; status: StaffStatus; notes: string; telegramId: string | null; discordUsername: string | null }>,
  actorUserId?: string | null,
) {
  const before = await prisma.staffMember.findUniqueOrThrow({ where: { id } });
  const staff = await prisma.staffMember.update({
    where: { id },
    data: input,
  });

  await prisma.staffHistory.create({
    data: {
      staffMemberId: id,
      actorUserId,
      action: "staff.updated",
      oldValue: before,
      newValue: staff,
    },
  });

  await writeAuditLog({
    actorUserId,
    action: "staff.updated",
    entityType: "StaffMember",
    entityId: id,
    oldValue: before,
    newValue: staff,
  });

  return staff;
}

export async function removeStaffMember(id: string, actorUserId?: string | null) {
  return updateStaffMember(id, { status: StaffStatus.REMOVED }, actorUserId);
}

export async function changeStaffLuckPermsGroup(id: string, group: string, actorUserId?: string | null) {
  const staff = await prisma.staffMember.update({
    where: { id },
    data: { pendingLuckPermsGroup: group },
  });

  const command = await queueLuckPermsGroupChange({
    staffMemberId: staff.id,
    username: staff.username,
    uuid: staff.uuid,
    group,
    requestedById: actorUserId,
  });

  await prisma.staffHistory.create({
    data: {
      staffMemberId: id,
      actorUserId,
      action: "staff.change_luckperms_group.queued",
      oldValue: { currentLuckPermsGroup: staff.currentLuckPermsGroup },
      newValue: { pendingLuckPermsGroup: group, commandId: command.id },
    },
  });

  await writeAuditLog({
    actorUserId,
    action: "staff.change_luckperms_group.queued",
    entityType: "StaffMember",
    entityId: id,
    newValue: { group, commandId: command.id },
  });

  return { staff, command };
}

export type MinecraftStaffSyncInput = {
  username: string;
  uuid?: string | null;
  telegramId?: string | null;
  discordUsername?: string | null;
  currentLuckPermsGroup: string;
  projectPosition?: string | null;
  status?: StaffStatus | null;
};

export async function syncStaffFromMinecraft(input: { staff: MinecraftStaffSyncInput[]; serverName?: string | null }) {
  const startedAt = new Date();
  let created = 0;
  let updated = 0;

  for (const row of input.staff) {
    const before = await prisma.staffMember.findUnique({ where: { username: row.username } });
    const staff = await prisma.staffMember.upsert({
      where: { username: row.username },
      create: {
        username: row.username,
        uuid: normalizeNullable(row.uuid),
        telegramId: normalizeNullable(row.telegramId),
        discordUsername: normalizeNullable(row.discordUsername),
        currentLuckPermsGroup: row.currentLuckPermsGroup,
        projectPosition: normalizeNullable(row.projectPosition) ?? row.currentLuckPermsGroup,
        status: row.status ?? StaffStatus.ACTIVE,
      },
      update: {
        uuid: normalizeNullable(row.uuid),
        telegramId: normalizeNullable(row.telegramId),
        discordUsername: normalizeNullable(row.discordUsername),
        currentLuckPermsGroup: row.currentLuckPermsGroup,
        projectPosition: normalizeNullable(row.projectPosition) ?? undefined,
        status: row.status ?? undefined,
      },
    });

    if (before) updated += 1;
    else created += 1;

    await prisma.staffHistory.create({
      data: {
        staffMemberId: staff.id,
        action: before ? "staff.minecraft_sync.updated" : "staff.minecraft_sync.created",
        oldValue: before ?? undefined,
        newValue: staff,
        metadata: { serverName: input.serverName ?? null },
      },
    });
  }

  const log = await prisma.integrationSyncLog.create({
    data: {
      integration: "minecraft_staff",
      status: SyncStatus.SUCCESS,
      message: `Minecraft staff sync completed: ${created} created, ${updated} updated.`,
      metadata: { created, updated, total: input.staff.length, serverName: input.serverName ?? null },
      startedAt,
      finishedAt: new Date(),
    },
  });

  return { created, updated, total: input.staff.length, log };
}

function normalizeNullable(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
