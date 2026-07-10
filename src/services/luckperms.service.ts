import { queueMinecraftCommand } from "@/services/minecraft.service";

export function isLuckPermsIntegrationConfigured() {
  return Boolean(process.env.MINECRAFT_PLUGIN_API_TOKEN);
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
