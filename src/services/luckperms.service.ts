import { queueMinecraftCommand } from "@/services/minecraft.service";

export function isLuckPermsIntegrationConfigured() {
  return Boolean(process.env.MINECRAFT_PLUGIN_API_TOKEN && getConfiguredLuckPermsStaffGroups().length > 0);
}

export function parseLuckPermsStaffGroups(value?: string | null) {
  const seen = new Set<string>();
  return (value ?? "")
    .split(",")
    .map(normalizeLuckPermsGroup)
    .filter((group) => {
      if (!group || seen.has(group)) return false;
      seen.add(group);
      return true;
    });
}

export function getConfiguredLuckPermsStaffGroups() {
  return parseLuckPermsStaffGroups(process.env.LUCKPERMS_STAFF_GROUPS);
}

export function normalizeLuckPermsGroup(group: string) {
  return group.trim().toLowerCase();
}

export function validateLuckPermsStaffGroup(group: string, groups = getConfiguredLuckPermsStaffGroups()) {
  const normalized = normalizeLuckPermsGroup(group);
  if (!normalized) return { ok: false as const, group: normalized, message: "LuckPerms group is required" };
  if (!groups.includes(normalized)) {
    return {
      ok: false as const,
      group: normalized,
      message: `Unknown LuckPerms group: ${normalized}`,
    };
  }
  return { ok: true as const, group: normalized };
}

export async function queueLuckPermsGroupChange(input: {
  staffMemberId: string;
  username: string;
  uuid?: string | null;
  group: string;
  requestedById?: string | null;
}) {
  return queueMinecraftCommand({
    type: "luckperms_change_group",
    staffMemberId: input.staffMemberId,
    requestedById: input.requestedById,
    payload: {
      username: input.username,
      uuid: input.uuid,
      group: input.group,
    },
  });
}
