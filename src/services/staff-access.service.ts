import { RoleKind, StaffStatus, type Prisma } from "@prisma/client";
import { SUPPORT_DUTY_KEY, resolveDutyEffective, type StaffDutyMode } from "@/config/roles";
import { prisma } from "@/lib/prisma";

const managedRoleKinds = [RoleKind.OWNER, RoleKind.STAFF_RANK, RoleKind.DUTY];

export class StaffAccessConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StaffAccessConflictError";
  }
}

export async function reconcileStaffAccess(staffMemberId: string) {
  return prisma.$transaction((tx) => reconcileStaffAccessInTransaction(tx, staffMemberId));
}

export async function ensureStaffUserAccessByTelegramId(telegramId: string) {
  const normalizedTelegramId = normalizeNullable(telegramId);
  if (!normalizedTelegramId) return false;

  const staff = await prisma.staffMember.findUnique({
    where: { telegramId: normalizedTelegramId },
    select: { id: true, status: true },
  });
  if (!staff || staff.status === StaffStatus.REMOVED) return false;

  await reconcileStaffAccess(staff.id);
  return true;
}

export async function reconcileStaffAccessInTransaction(tx: Prisma.TransactionClient, staffMemberId: string) {
  const staff = await tx.staffMember.findUniqueOrThrow({
    where: { id: staffMemberId },
    include: { user: true, dutyOverrides: true },
  });
  const telegramId = normalizeNullable(staff.telegramId);

  if (!telegramId) {
    if (staff.user) {
      await tx.userRole.updateMany({ where: { userId: staff.user.id }, data: { active: false } });
      await tx.user.update({ where: { id: staff.user.id }, data: { active: false, staffMemberId: null } });
    }
    return null;
  }

  let user = staff.user;
  if (user && user.telegramId !== telegramId) {
    const conflict = await tx.user.findUnique({ where: { telegramId } });
    if (conflict && conflict.id !== user.id) {
      throw new StaffAccessConflictError("Этот Telegram ID уже используется другим аккаунтом.");
    }
  }

  if (!user) {
    const existing = await tx.user.findUnique({ where: { telegramId } });
    if (existing?.staffMemberId && existing.staffMemberId !== staff.id) {
      throw new StaffAccessConflictError("Этот Telegram ID уже привязан к другому сотруднику.");
    }
    user = existing
      ? await tx.user.update({
          where: { id: existing.id },
          data: { staffMemberId: staff.id, displayName: staff.username },
        })
      : await tx.user.create({
          data: {
            telegramId,
            displayName: staff.username,
            staffMemberId: staff.id,
          },
        });
  }

  const active = staff.status !== StaffStatus.REMOVED;
  user = await tx.user.update({
    where: { id: user.id },
    data: {
      telegramId,
      displayName: staff.username,
      staffMemberId: staff.id,
      active,
    },
  });

  const rankRole = await tx.role.findUnique({
    where: { key: staff.currentLuckPermsGroup },
    include: { defaultDuties: true },
  });
  const dutyRoles = await tx.role.findMany({ where: { kind: RoleKind.DUTY }, select: { id: true } });
  const dutyRoleIds = new Set(dutyRoles.map((role) => role.id));
  const effectiveDutyIds = new Set(rankRole?.defaultDuties.map((item) => item.dutyRoleId) ?? []);

  for (const override of staff.dutyOverrides) {
    if (!dutyRoleIds.has(override.dutyRoleId)) continue;
    if (override.enabled) effectiveDutyIds.add(override.dutyRoleId);
    else effectiveDutyIds.delete(override.dutyRoleId);
  }

  const selectedRoleIds = active
    ? [rankRole?.kind === RoleKind.STAFF_RANK ? rankRole.id : null, ...effectiveDutyIds].filter((id): id is string => Boolean(id))
    : [];

  await tx.userRole.updateMany({
    where: {
      userId: user.id,
      role: { kind: { in: managedRoleKinds } },
      ...(selectedRoleIds.length > 0 ? { roleId: { notIn: selectedRoleIds } } : {}),
    },
    data: { active: false },
  });

  for (const roleId of selectedRoleIds) {
    await tx.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      create: { userId: user.id, roleId, active: true },
      update: { active: true, expiresAt: null },
    });
  }

  return user;
}

export async function reconcileStaffAccessForRank(rankKey: string) {
  const staff = await prisma.staffMember.findMany({ where: { currentLuckPermsGroup: rankKey }, select: { id: true } });
  for (const member of staff) {
    await reconcileStaffAccess(member.id);
  }
}

export async function getStaffDutyStates(staffMemberId: string) {
  const staff = await prisma.staffMember.findUniqueOrThrow({
    where: { id: staffMemberId },
    include: { dutyOverrides: true },
  });
  const [rankRole, duties] = await Promise.all([
    prisma.role.findUnique({ where: { key: staff.currentLuckPermsGroup }, include: { defaultDuties: true } }),
    prisma.role.findMany({ where: { kind: RoleKind.DUTY }, orderBy: [{ priority: "desc" }, { name: "asc" }] }),
  ]);
  const defaults = new Set(rankRole?.defaultDuties.map((item) => item.dutyRoleId) ?? []);
  const overrides = new Map(staff.dutyOverrides.map((item) => [item.dutyRoleId, item.enabled]));

  return duties.map((duty) => {
    const override = overrides.get(duty.id);
    const mode: StaffDutyMode = override === undefined ? "INHERIT" : override ? "ENABLED" : "DISABLED";
    const defaultEnabled = defaults.has(duty.id);
    return {
      key: duty.key,
      name: duty.name,
      mode,
      defaultEnabled,
      effective: resolveDutyEffective(defaultEnabled, mode),
    };
  });
}

export async function setStaffDutyMode(input: { staffMemberId: string; dutyKey: string; mode: StaffDutyMode }) {
  return prisma.$transaction(async (tx) => {
    const duty = await tx.role.findFirstOrThrow({ where: { key: input.dutyKey, kind: RoleKind.DUTY } });
    if (input.mode === "INHERIT") {
      await tx.staffDutyOverride.deleteMany({ where: { staffMemberId: input.staffMemberId, dutyRoleId: duty.id } });
    } else {
      await tx.staffDutyOverride.upsert({
        where: { staffMemberId_dutyRoleId: { staffMemberId: input.staffMemberId, dutyRoleId: duty.id } },
        create: { staffMemberId: input.staffMemberId, dutyRoleId: duty.id, enabled: input.mode === "ENABLED" },
        update: { enabled: input.mode === "ENABLED" },
      });
    }
    await reconcileStaffAccessInTransaction(tx, input.staffMemberId);
    return { dutyKey: duty.key, mode: input.mode };
  });
}

export async function ensureSupportDutyExists() {
  return prisma.role.findUnique({ where: { key: SUPPORT_DUTY_KEY } });
}

function normalizeNullable(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
