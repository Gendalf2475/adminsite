import { StaffStatus, SyncStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { queueLuckPermsGroupChange } from "@/services/luckperms.service";
import {
  reconcileStaffAccess,
  reconcileStaffAccessInTransaction,
  setStaffDutyMode as persistStaffDutyMode,
} from "@/services/staff-access.service";
import type { StaffDutyMode } from "@/config/roles";

export async function listStaff() {
  return prisma.staffMember.findMany({
    include: { assignedBy: { include: { staffMember: true } } },
    orderBy: [{ status: "asc" }, { assignedAt: "desc" }],
  });
}

export async function getStaffMember(id: string) {
  return prisma.staffMember.findUnique({
    where: { id },
    include: {
      assignedBy: { include: { staffMember: true } },
      user: true,
      dutyOverrides: { include: { dutyRole: true } },
      history: { include: { actor: { include: { staffMember: true } } }, orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
}

export async function createStaffMember(input: {
  username: string;
  telegramId?: string;
  discordUsername?: string;
  currentLuckPermsGroup: string;
  assignedById?: string | null;
}) {
  const staff = await prisma.$transaction(async (tx) => {
    const created = await tx.staffMember.create({
      data: {
        username: input.username,
        telegramId: normalizeNullable(input.telegramId),
        discordUsername: normalizeNullable(input.discordUsername),
        currentLuckPermsGroup: input.currentLuckPermsGroup,
        pendingLuckPermsGroup: input.currentLuckPermsGroup,
        projectPosition: input.currentLuckPermsGroup,
        assignedById: input.assignedById,
        status: StaffStatus.PROBATION,
      },
    });
    await reconcileStaffAccessInTransaction(tx, created.id);
    return created;
  });

  const command = await queueLuckPermsGroupChange({
    staffMemberId: staff.id,
    username: staff.username,
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
  input: Partial<{ status: StaffStatus; telegramId: string | null; discordUsername: string | null }>,
  actorUserId?: string | null,
) {
  const before = await prisma.staffMember.findUniqueOrThrow({ where: { id } });
  const changedFields = Object.keys(input).filter((key) => {
    const value = input[key as keyof typeof input];
    return value !== undefined && before[key as keyof typeof before] !== value;
  });
  const staff = await prisma.$transaction(async (tx) => {
    const updated = await tx.staffMember.update({
      where: { id },
      data: {
        ...input,
        telegramId: input.telegramId === undefined ? undefined : normalizeNullable(input.telegramId),
        discordUsername: input.discordUsername === undefined ? undefined : normalizeNullable(input.discordUsername),
      },
    });
    await reconcileStaffAccessInTransaction(tx, id);
    await tx.staffHistory.create({
      data: {
        staffMemberId: id,
        actorUserId,
        action: "staff.updated",
        oldValue: before,
        newValue: updated,
        metadata: { changedFields },
      },
    });
    return updated;
  });

  await writeAuditLog({
    actorUserId,
    action: "staff.updated",
    entityType: "StaffMember",
    entityId: id,
    oldValue: before,
    newValue: staff,
    metadata: { changedFields },
  });

  return staff;
}

export async function removeStaffMember(id: string, actorUserId?: string | null) {
  return updateStaffMember(id, { status: StaffStatus.REMOVED }, actorUserId);
}

export async function changeStaffLuckPermsGroup(id: string, group: string, actorUserId?: string | null) {
  const current = await prisma.staffMember.findUniqueOrThrow({ where: { id } });
  if (current.currentLuckPermsGroup === group && !current.pendingLuckPermsGroup) {
    return { staff: current, command: null };
  }
  if (current.pendingLuckPermsGroup === group) {
    return { staff: current, command: null };
  }

  const staff = await prisma.staffMember.update({
    where: { id },
    data: { pendingLuckPermsGroup: group },
  });

  const command = await queueLuckPermsGroupChange({
    staffMemberId: staff.id,
    username: staff.username,
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

export async function updateStaffDutyMode(input: {
  id: string;
  dutyKey: string;
  mode: StaffDutyMode;
  actorUserId?: string | null;
}) {
  const before = await prisma.staffDutyOverride.findFirst({
    where: { staffMemberId: input.id, dutyRole: { key: input.dutyKey } },
  });
  const result = await persistStaffDutyMode({ staffMemberId: input.id, dutyKey: input.dutyKey, mode: input.mode });

  await prisma.staffHistory.create({
    data: {
      staffMemberId: input.id,
      actorUserId: input.actorUserId,
      action: "staff.duty.updated",
      oldValue: before ? { enabled: before.enabled } : { mode: "INHERIT" },
      newValue: result,
    },
  });
  await writeAuditLog({
    actorUserId: input.actorUserId,
    action: "staff.duty.updated",
    entityType: "StaffMember",
    entityId: input.id,
    oldValue: before ? { enabled: before.enabled } : { mode: "INHERIT" },
    newValue: result,
  });
  return result;
}

export type MinecraftStaffSyncInput = {
  username: string;
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
        telegramId: normalizeNullable(row.telegramId),
        discordUsername: normalizeNullable(row.discordUsername),
        currentLuckPermsGroup: row.currentLuckPermsGroup,
        projectPosition: normalizeNullable(row.projectPosition) ?? row.currentLuckPermsGroup,
        status: row.status ?? StaffStatus.ACTIVE,
      },
      update: {
        currentLuckPermsGroup: row.currentLuckPermsGroup,
        pendingLuckPermsGroup: before?.pendingLuckPermsGroup === row.currentLuckPermsGroup ? null : undefined,
      },
    });

    await reconcileStaffAccess(staff.id);

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
