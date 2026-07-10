import { CommandStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { resolveCommandStatus } from "@/services/minecraft-command-state";

export type QueueMinecraftCommandInput = {
  type: string;
  payload: Record<string, unknown>;
  requestedById?: string | null;
  staffMemberId?: string | null;
  ttlSeconds?: number;
};

export async function queueMinecraftCommand(input: QueueMinecraftCommandInput) {
  const expiresAt = input.ttlSeconds ? new Date(Date.now() + input.ttlSeconds * 1000) : new Date(Date.now() + 1000 * 60 * 60 * 24);
  const command = await prisma.minecraftCommandQueue.create({
    data: {
      type: input.type,
      payload: JSON.parse(JSON.stringify(input.payload)) as Prisma.InputJsonValue,
      requestedById: input.requestedById,
      staffMemberId: input.staffMemberId,
      expiresAt,
    },
  });

  await writeAuditLog({
    actorUserId: input.requestedById,
    action: "minecraft.command.queued",
    entityType: "MinecraftCommandQueue",
    entityId: command.id,
    newValue: { type: input.type, payload: input.payload },
  });

  return command;
}

export async function pullPendingCommands(limit = 25) {
  const now = new Date();
  const staleLockCutoff = new Date(now.getTime() - 30_000);

  await prisma.minecraftCommandQueue.updateMany({
    where: {
      status: { in: [CommandStatus.PENDING, CommandStatus.PROCESSING] },
      expiresAt: { lte: now },
    },
    data: {
      status: CommandStatus.EXPIRED,
      processedAt: now,
      errorMessage: "Command expired before plugin pickup.",
    },
  });

  await prisma.minecraftCommandQueue.updateMany({
    where: {
      status: CommandStatus.PROCESSING,
      AND: [
        { OR: [{ lockedAt: null }, { lockedAt: { lte: staleLockCutoff } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      ],
    },
    data: {
      status: CommandStatus.PENDING,
      lockedAt: null,
      errorMessage: null,
    },
  });

  const commands = await prisma.minecraftCommandQueue.findMany({
    where: {
      status: CommandStatus.PENDING,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  if (commands.length === 0) return [];

  await prisma.minecraftCommandQueue.updateMany({
    where: { id: { in: commands.map((command) => command.id) } },
    data: {
      status: CommandStatus.PROCESSING,
      lockedAt: now,
      attempts: { increment: 1 },
      processedAt: null,
      errorMessage: null,
    },
  });

  return commands;
}

export async function recordCommandResult(input: { commandId: string; success: boolean; result?: unknown; errorMessage?: string }) {
  const command = await prisma.minecraftCommandQueue.findUniqueOrThrow({ where: { id: input.commandId } });
  const status = resolveCommandStatus(
    {
      status: command.status,
      expiresAt: command.expiresAt,
    },
    { success: input.success },
  );

  const updated = await prisma.minecraftCommandQueue.update({
    where: { id: input.commandId },
    data: {
      status,
      result: input.result === undefined ? undefined : (JSON.parse(JSON.stringify(input.result)) as Prisma.InputJsonValue),
      errorMessage: input.errorMessage,
      processedAt: new Date(),
    },
  });

  if (status === "SUCCESS" && command.type === "luckperms_change_group" && command.staffMemberId) {
    const payload = command.payload as { group?: string };
    if (payload.group) {
      await prisma.staffMember.update({
        where: { id: command.staffMemberId },
        data: {
          currentLuckPermsGroup: payload.group,
          pendingLuckPermsGroup: null,
        },
      });
    }
  }

  await writeAuditLog({
    actorUserId: command.requestedById,
    action: `minecraft.command.${status.toLowerCase()}`,
    entityType: "MinecraftCommandQueue",
    entityId: command.id,
    newValue: { status, result: input.result, errorMessage: input.errorMessage },
  });

  return updated;
}

export function verifyMinecraftPluginToken(token: string | null) {
  const expected = process.env.MINECRAFT_PLUGIN_API_TOKEN;
  return Boolean(expected && token && expected === token);
}
