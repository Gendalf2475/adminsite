import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { parseJson } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth";
import { changeStaffLuckPermsGroup } from "@/services/staff.service";
import { isLuckPermsIntegrationConfigured, validateLuckPermsStaffGroup } from "@/services/luckperms.service";

export const runtime = "nodejs";

const schema = z.object({ group: z.string().min(2) });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission("staff.change_luckperms_group");
  if (!guard.ok) return guard.response;
  if (!isLuckPermsIntegrationConfigured()) {
    return NextResponse.json({ error: "LuckPerms integration is not configured" }, { status: 503 });
  }
  const parsed = await parseJson(request, schema);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  const group = validateLuckPermsStaffGroup(parsed.data.group);
  if (!group.ok) return NextResponse.json({ error: group.message }, { status: 422 });
  const { id } = await context.params;
  return NextResponse.json({ data: await changeStaffLuckPermsGroup(id, group.group, guard.user.id) }, { status: 202 });
}
