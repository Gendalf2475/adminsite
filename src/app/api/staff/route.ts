import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { parseJson } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth";
import { createStaffMember, listStaff } from "@/services/staff.service";
import { isLuckPermsIntegrationConfigured, validateLuckPermsStaffGroup } from "@/services/luckperms.service";
import { canAssignStaffGroup } from "@/config/roles";
import { StaffAccessConflictError } from "@/services/staff-access.service";

export const runtime = "nodejs";

const createStaffSchema = z.object({
  username: z.string().regex(/^[A-Za-z0-9_]{2,16}$/, "Use a valid Minecraft nickname"),
  telegramId: z.string().optional(),
  discordUsername: z.string().optional(),
  currentLuckPermsGroup: z.string().min(2),
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
  if (!canAssignStaffGroup(guard.user, group.group)) {
    return NextResponse.json({ error: "Нельзя назначить этот ранг." }, { status: 403 });
  }

  try {
    const data = await createStaffMember({ ...parsed.data, currentLuckPermsGroup: group.group, assignedById: guard.user.id });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof StaffAccessConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
    throw error;
  }
}
