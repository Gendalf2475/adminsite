import type { MinecraftCommand } from "@/types/domain";

export function isCommandExpired(command: Pick<MinecraftCommand, "expiresAt">, now = new Date()) {
  return Boolean(command.expiresAt && command.expiresAt.getTime() <= now.getTime());
}

export function resolveCommandStatus(
  command: Pick<MinecraftCommand, "status" | "expiresAt">,
  result: { success: boolean },
  now = new Date(),
) {
  if (isCommandExpired(command, now)) return "EXPIRED" as const;
  return result.success ? "SUCCESS" : "FAILED";
}
