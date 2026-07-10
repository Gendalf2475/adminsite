import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { parseJson } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth";
import { createStaffMember, listStaff } from "@/services/staff.service";
import { isLuckPermsIntegrationConfigured, validateLuckPermsStaffGroup } from "@/services/luckperms.service";

export const runtime = "nodejs";

const createStaffSchema = z.object({
  username: z.string().min(2),
  telegramId: z.string().optional(),
  discordUsername: z.string().optional(),
  currentLuckPermsGroup: z.string().min(2),
  projectPosition: z.string().min(2),
});

export async function GET() {
  const guard = await requireApiPermission("staff.view");
  if (!guard.ok) return guard.response;
  return NextResponse.json({ data: await listStaff() });
}

export async function POST(request: NextRequest) {
  const guard = await requireApiPermission("staff.manage");
  if (!guard.ok) return guard.response;
  if (!isLuckPermsIntegrationConfigured()) {
    return NextResponse.json({ error: "LuckPerms integration is not configured" }, { status: 503 });
  }

  const parsed = await parseJson(request, createStaffSchema);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });

  const group = validateLuckPermsStaffGroup(parsed.data.currentLuckPermsGroup);
  if (!group.ok) return NextResponse.json({ error: group.message }, { status: 422 });

  const data = await createStaffMember({ ...parsed.data, currentLuckPermsGroup: group.group, assignedById: guard.user.id });
  return NextResponse.json({ data }, { status: 201 });
}
